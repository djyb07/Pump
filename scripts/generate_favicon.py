from PIL import Image
import os

def create_favicon():
    # Paths
    source_path = os.path.join('client', 'public', 'pump-logo.png')
    dest_path = os.path.join('client', 'public', 'favicon.png')
    
    # Check if source exists
    if not os.path.exists(source_path):
        print(f"Error: Source file '{source_path}' not found.")
        return

    try:
        # Open the source image
        img = Image.open(source_path)
        print(f"Original image size: {img.size}")
        
        # Calculate new size maintaining aspect ratio
        # Target is 512x512 square canvas
        # We want the logo to be roughly 80% of the canvas width to leave breathing room
        target_canvas_size = (512, 512)
        target_logo_width = int(target_canvas_size[0] * 0.9) # 90% width
        
        # Calculate aspect ratio
        aspect_ratio = img.height / img.width
        new_height = int(target_logo_width * aspect_ratio)
        
        # Resize original image
        img_resized = img.resize((target_logo_width, new_height), Image.Resampling.LANCZOS)
        
        # Create new transparent square image
        new_img = Image.new("RGBA", target_canvas_size, (0, 0, 0, 0))
        
        # Calculate position to center the logo
        x_pos = (target_canvas_size[0] - target_logo_width) // 2
        y_pos = (target_canvas_size[1] - new_height) // 2
        
        # Paste the resized logo onto the canvas
        new_img.paste(img_resized, (x_pos, y_pos))
        
        # Save the new favicon
        new_img.save(dest_path, "PNG")
        print(f"Success: Created square favicon at '{dest_path}'")
        
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    create_favicon()
