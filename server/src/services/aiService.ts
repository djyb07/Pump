import Groq from 'groq-sdk';
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
 * Build a muscle-group lookup map from the Exercise table.
 * Returns a Map<exerciseId, muscleGroups[]> for O(1) lookups.
 */
async function buildMuscleGroupMap(exerciseIds: string[]): Promise<Map<string, string[]>> {
    const unique = [...new Set(exerciseIds)];
    if (unique.length === 0) return new Map();

    const exercises = await prisma.exercise.findMany({
        where: { id: { in: unique } },
        select: { id: true, muscleGroups: true },
    });

    return new Map(exercises.map(e => [e.id, e.muscleGroups]));
}

/**
 * Converts complex Prisma WorkoutLog objects into a granular text summary
 * with per-set detail (weight, reps, type, RPE) and muscle group tags.
 *
 * Example output:
 *  SESSION 2024-01-15 | Push Day | 65min
 *    Bench Press [Chest, Triceps, Shoulders]:
 *      Set 1: 60kg × 12 [WARMUP]
 *      Set 2: 100kg × 8 @RPE8
 *      Set 3: 100kg × 7 @RPE9
 *    Tricep Pushdowns [Triceps]:
 *      Set 1: 30kg × 12 @RPE7
 */
function minifyWorkoutData(
    workoutLogs: any[],
    muscleMap: Map<string, string[]>,
): string {
    if (workoutLogs.length === 0) return 'No workout data available.';

    return workoutLogs.map(log => {
        const date = new Date(log.startTime).toISOString().split('T')[0];
        const dayName = sanitize(log.dayName) || 'Workout';
        const duration = log.duration ? `${log.duration}min` : '';
        const header = `SESSION ${date} | ${dayName}${duration ? ` | ${duration}` : ''}`;

        const exercises = (log.exerciseLogs || []).map((exLog: any) => {
            const name = sanitize(exLog.exerciseName) || 'Exercise';
            const muscles = muscleMap.get(exLog.exerciseId);
            const muscleTag = muscles?.length ? ` [${muscles.join(', ')}]` : '';

            const sets = (exLog.sets as any[] || [])
                .filter((s: any) => s.completed !== false)
                .map((s: any, i: number) => {
                    const setNum = s.setNumber || i + 1;
                    const weight = s.weight || 0;
                    const reps = s.reps || 0;
                    const type = (s.type && s.type !== 'NORMAL') ? ` [${s.type}]` : '';
                    const rpe = s.rpe ? ` @RPE${s.rpe}` : '';
                    return `      Set ${setNum}: ${weight}kg × ${reps}${type}${rpe}`;
                })
                .join('\n');

            return `    ${name}${muscleTag}:\n${sets || '      (no completed sets)'}`;
        }).join('\n');

        const notes = log.notes ? `\n    Notes: ${sanitize(log.notes)}` : '';
        return `${header}\n${exercises}${notes}`;
    }).join('\n\n');
}

// ===== Mock Fallback =====

/**
 * Returns a hardcoded mock report for demo/fallback purposes.
 * Used when GROQ_API_KEY is missing or the API call fails.
 */
function getMockReport(): AIReport {
    return {
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
}

// ===== System Prompt =====

const SYSTEM_PROMPT = `You are a hard-science strength & conditioning coach who speaks directly to the athlete in the second person ("you").
You will receive structured workout logs from the past 4 weeks. Each session includes the date, day name, duration, exercises with tagged muscle groups, and every completed set with its weight, reps, set type (WARMUP/NORMAL/DROPSET/FAILURE), and RPE where available.

Perform the following analysis:

1. **Volume Trends**: Calculate total effective volume per muscle group per week (exclude WARMUP sets). Identify week-over-week increases, stalls, or regressions. Reference specific exercises and dates.

2. **Intensity Evaluation**: Use RPE data to assess proximity to failure. Flag exercises where RPE is consistently below 7 (undertraining) or consistently at 10 (overreaching). Note any sessions with no RPE data and suggest the athlete starts logging it.

3. **Muscle Group Coverage**: Cross-reference the muscle group tags against the major groups (Chest, Back, Shoulders, Arms, Core, Quads, Glutes, Hamstrings). Identify any group that received fewer than 6 effective sets per week (minimum effective volume threshold) or any group completely absent.

4. **Progressive Overload**: For the top 3-5 most frequently performed exercises, compare the best working set (heaviest weight × reps, excluding warmups) from week 1 vs week 4. Identify plateaus or regressions by exercise name and date.

5. **Recovery & Frequency**: Flag if the same muscle group was trained with fewer than 48 hours of rest, or if any muscle group was only hit 1× per week when 2× is optimal.

Be specific — cite exercise names, dates, weights, and reps from the data. Do not give generic advice. Every observation must be traceable to the provided logs.

Tone: Direct, data-driven, no fluff. Use "you" and "your".

Output strictly valid JSON with exactly these keys:
{
  "summary": "A 2-3 sentence data-backed overview of the athlete's 4-week training block.",
  "positive_feedback": ["2-4 specific, data-cited positive observations."],
  "areas_for_improvement": ["2-4 specific, data-cited areas needing attention."],
  "actionable_tips": ["3-5 concrete, specific recommendations with numbers (e.g., 'Add 2.5kg to your squat on 2024-01-22')."]
}

Do NOT include any text outside the JSON object. Do NOT use markdown code fences.`;

// ===== Main Service =====

/**
 * Generates a weekly AI analysis report for the given user.
 * Fetches 4 weeks of workout logs with per-set granularity and muscle
 * group enrichment, then calls Groq for hard-science analysis.
 * Falls back to a mock response if GROQ_API_KEY is missing or the API fails.
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

    // Collect all exercise IDs for muscle group lookup
    const exerciseIds = workoutLogs.flatMap(log =>
        (log.exerciseLogs || []).map((el: any) => el.exerciseId)
    ).filter(Boolean);

    const muscleMap = await buildMuscleGroupMap(exerciseIds);
    const summary = minifyWorkoutData(workoutLogs, muscleMap);

    // ------ Mock Mode: no API key ------
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn('[AI Coach] GROQ_API_KEY not set — returning mock report after 2s delay');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return getMockReport();
    }

    // ------ Live Mode: call Groq ------
    try {
        const groq = new Groq({ apiKey });

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Here are my workout logs from the past 4 weeks:\n\n${summary}` },
            ],
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('LLM_EMPTY_RESPONSE');
        }

        const parsed: AIReport = JSON.parse(content);

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
    } catch (error: any) {
        console.warn('[AI Coach] Groq API failed, falling back to mock data:', error.message);
        return getMockReport();
    }
}
