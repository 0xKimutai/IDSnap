#!/usr/bin/env python3
"""
IDSnap App Icon Generator
Creates professional app icons in multiple sizes for Android
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a professional IDSnap icon"""
    
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors - Professional blue gradient
    bg_color = (33, 150, 243)  # Material Blue
    text_color = (255, 255, 255)  # White
    accent_color = (255, 193, 7)  # Amber accent
    
    # Draw background circle
    margin = size // 20
    draw.ellipse([margin, margin, size-margin, size-margin], fill=bg_color)
    
    # Add subtle gradient effect (darker at bottom)
    gradient_overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient_overlay)
    
    for i in range(size//2):
        alpha = int(30 * (i / (size//2)))
        gradient_draw.ellipse([margin, margin + i, size-margin, size-margin], 
                            fill=(0, 0, 0, alpha))
    
    img = Image.alpha_composite(img, gradient_overlay)
    draw = ImageDraw.Draw(img)
    
    # Calculate font size based on icon size
    font_size = max(size // 8, 12)
    
    try:
        # Try to use a system font
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
    
    # Draw "ID" text
    text = "ID"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - size // 12
    
    # Add text shadow
    shadow_offset = max(1, size // 100)
    draw.text((text_x + shadow_offset, text_y + shadow_offset), text, 
              fill=(0, 0, 0, 100), font=font)
    
    # Draw main text
    draw.text((text_x, text_y), text, fill=text_color, font=font)
    
    # Draw camera icon representation (small rectangle)
    cam_size = size // 6
    cam_x = (size - cam_size) // 2
    cam_y = text_y + text_height + size // 20
    
    # Camera body
    draw.rectangle([cam_x, cam_y, cam_x + cam_size, cam_y + cam_size//2], 
                   fill=accent_color)
    
    # Camera lens
    lens_size = cam_size // 3
    lens_x = cam_x + (cam_size - lens_size) // 2
    lens_y = cam_y + (cam_size//2 - lens_size) // 2
    draw.ellipse([lens_x, lens_y, lens_x + lens_size, lens_y + lens_size], 
                 fill=(0, 0, 0, 150))
    
    # Save the icon
    img.save(output_path, 'PNG')
    print(f"Created icon: {output_path} ({size}x{size})")

def main():
    """Generate all required icon sizes"""
    
    # Android icon sizes
    sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    
    base_path = "android/app/src/main/res"
    
    print("Generating IDSnap app icons...")
    print("=" * 40)
    
    for folder, size in sizes.items():
        folder_path = os.path.join(base_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Create regular icon
        icon_path = os.path.join(folder_path, "ic_launcher.png")
        create_icon(size, icon_path)
        
        # Create round icon (same design)
        round_icon_path = os.path.join(folder_path, "ic_launcher_round.png")
        create_icon(size, round_icon_path)
    
    print("=" * 40)
    print("✓ All icons generated successfully!")
    print("✓ Icons are ready for APK build")
    print("\nTo rebuild APK with new icons:")
    print("1. cd android")
    print("2. ./gradlew clean")
    print("3. ./gradlew assembleRelease")

if __name__ == "__main__":
    main()
