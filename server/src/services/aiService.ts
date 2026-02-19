import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../prisma';

// ===== Types =====

export interface AIReport {
    summary: string;
    positive_feedback: string[];
    areas_for_improvement: string[];
    actionable_tips: string[];
}

// ===== Data Minification =====

/**
 * Sanitize user-generated text (notes) to prevent prompt injection
 * and formatting errors when sending to the LLM.
 */
function sanitize(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '')               // Strip HTML/script tags
        .replace(/[^\w\s.,!?@():;\-–—'/°%#+×]/g, '') // Keep only safe characters
        .trim()
        .slice(0, 200);                        // Cap length per note
}

/**
 * Converts complex Prisma WorkoutLog objects into a compact text summary
 * to minimize LLM token usage while preserving training signal.
 *
 *  Example output line:
 *  "2023-10-01 | Push Day | Bench Press: 100kg×5 @RPE9, 95kg×8 @RPE8 | Skull Crushers: 30kg×12"
 */
function minifyWorkoutData(workoutLogs: any[]): string {
    if (workoutLogs.length === 0) return 'No workout data available.';

    return workoutLogs.map(log => {
        const date = new Date(log.startTime).toISOString().split('T')[0];
        const dayName = sanitize(log.dayName) || 'Workout';
        const duration = log.duration ? `${log.duration}min` : '';

        const exercises = (log.exerciseLogs || []).map((exLog: any) => {
            const name = sanitize(exLog.exerciseName) || 'Exercise';
            const sets = (exLog.sets as any[] || [])
                .filter((s: any) => s.completed !== false)
                .map((s: any) => {
                    let part = `${s.weight || 0}kg×${s.reps || 0}`;
                    if (s.type && s.type !== 'NORMAL') part += ` [${s.type}]`;
                    if (s.rpe) part += ` @RPE${s.rpe}`;
                    return part;
                })
                .join(', ');
            return `${name}: ${sets || 'no sets'}`;
        }).join(' | ');

        const notes = log.notes ? ` Notes: ${sanitize(log.notes)}` : '';
        return `${date} | ${dayName} ${duration} | ${exercises}${notes}`;
    }).join('\n');
}

// ===== Mock Response =====

const MOCK_REPORT: AIReport = {
    summary: "You've been training consistently over the past few weeks with a solid push/pull/legs structure. Your volume is trending upward and RPE management shows good autoregulation awareness.",
    positive_feedback: [
        "Great consistency — you trained 4 times per week on average.",
        "Your bench press shows clear progressive overload: weight increased by ~5kg over 4 weeks.",
        "Smart use of RPE — most working sets stayed in the 7-9 range, leaving appropriate reps in reserve."
    ],
    areas_for_improvement: [
        "Lower body volume is significantly lower than upper body — potential muscle imbalance developing.",
        "No dedicated core or posterior chain work detected in recent sessions.",
        "RPE on leg exercises tends to stay at 6-7, suggesting you could push intensity higher."
    ],
    actionable_tips: [
        "Add one extra leg session per week, or include 2-3 leg accessory exercises on upper body days.",
        "Incorporate planks, hanging leg raises, or ab wheel rollouts for 2-3 sets at the end of each session.",
        "Try adding 2.5kg to your squat each week and aim for RPE 8 on your top sets.",
        "Consider a deload week every 4-5 weeks to manage accumulated fatigue."
    ]
};

// ===== Prompt =====

const SYSTEM_PROMPT = `You are an elite strength and conditioning coach. Analyze the user's workout logs from the past 4 weeks. Look for:
- Progressive overload stalls (plateaus in weight or reps)
- Muscle imbalances (e.g., skipped leg days, neglected muscle groups)
- RPE consistency and autoregulation quality
- Training frequency and recovery patterns
- Volume distribution across muscle groups

Output strictly valid JSON with exactly these keys:
{
  "summary": "A 2-3 sentence overview of the user's training period.",
  "positive_feedback": ["Array of 2-4 specific positive observations."],
  "areas_for_improvement": ["Array of 2-4 specific areas that need attention."],
  "actionable_tips": ["Array of 3-5 concrete, actionable recommendations."]
}`;

// ===== Helpers =====

/**
 * Strip markdown code fences if the model wraps the JSON response in them.
 * Handles ```json ... ``` and ``` ... ``` variants.
 */
function stripCodeFences(text: string): string {
    return text
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
}

// ===== Main Service =====

/**
 * Generates a weekly AI analysis report for the given user.
 * Fetches 4 weeks of workout logs, minifies the data, and calls Google Gemini.
 * Falls back to a mock response if GEMINI_API_KEY is not configured.
 */
export async function generateWeeklyReport(userId: string): Promise<AIReport> {
    // Fetch last 4 weeks of completed workouts
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const workoutLogs = await prisma.workoutLog.findMany({
        where: {
            userId,
            status: 'completed',
            startTime: { gte: fourWeeksAgo },
        },
        include: {
            exerciseLogs: true,
        },
        orderBy: { startTime: 'asc' },
    });

    if (workoutLogs.length === 0) {
        throw new Error('NOT_ENOUGH_DATA');
    }

    const summary = minifyWorkoutData(workoutLogs);

    // ------ Mock Mode: no API key ------
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('[AI Coach] GEMINI_API_KEY not set — returning mock report after 2s delay');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return MOCK_REPORT;
    }

    // ------ Live Mode: call Google Gemini ------
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-pro',
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 1024,
        },
    });

    const prompt = `${SYSTEM_PROMPT}\n\nHere are my workout logs from the past 4 weeks:\n\n${summary}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
        throw new Error('LLM_EMPTY_RESPONSE');
    }

    // Parse — strip code fences if present, then parse JSON
    const cleaned = stripCodeFences(text);
    const parsed: AIReport = JSON.parse(cleaned);

    // Validate shape
    if (
        typeof parsed.summary !== 'string' ||
        !Array.isArray(parsed.positive_feedback) ||
        !Array.isArray(parsed.areas_for_improvement) ||
        !Array.isArray(parsed.actionable_tips)
    ) {
        throw new Error('LLM_INVALID_FORMAT');
    }

    return parsed;
}
