"""Convert JPG images with checkered backgrounds to transparent PNGs."""

import os
import numpy as np
from PIL import Image
from collections import deque

def get_bg_color(img_array):
    """Sample background color from corner pixels."""
    corners = [
        img_array[0, 0],
        img_array[0, 1],
        img_array[1, 0],
        img_array[0, -1],
        img_array[-1, 0],
        img_array[-1, -1],
    ]
    return np.mean(corners, axis=0).astype(np.uint8)


def remove_checkered_bg(input_path, output_path, tolerance=30):
    """Remove checkered background via flood fill from edges."""
    img = Image.open(input_path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape

    bg_color = get_bg_color(arr)
    print(f"  Detected bg color: {bg_color}, tolerance: {tolerance}")

    # Create alpha mask (255 = opaque, 0 = transparent)
    alpha = np.full((h, w), 255, dtype=np.uint8)

    # Track visited pixels
    visited = np.zeros((h, w), dtype=bool)

    def color_matches(pixel):
        return np.all(np.abs(pixel.astype(np.int16) - bg_color.astype(np.int16)) <= tolerance)

    # Flood fill from all edge pixels
    queue = deque()

    # Add all edge pixels as starting points
    for x in range(w):
        for y in [0, h - 1]:
            if not visited[y, x] and color_matches(arr[y, x]):
                queue.append((y, x))
                visited[y, x] = True
    for y in range(h):
        for x in [0, w - 1]:
            if not visited[y, x] and color_matches(arr[y, x]):
                queue.append((y, x))
                visited[y, x] = True

    # BFS flood fill
    while queue:
        cy, cx = queue.popleft()
        alpha[cy, cx] = 0  # Make transparent

        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                visited[ny, nx] = True
                if color_matches(arr[ny, nx]):
                    queue.append((ny, nx))

    # Combine RGB + alpha
    rgba = np.dstack([arr, alpha])
    result = Image.fromarray(rgba, "RGBA")
    result.save(output_path, "PNG")

    total_pixels = h * w
    transparent_pixels = np.sum(alpha == 0)
    print(f"  Size: {w}x{h}, Transparent: {transparent_pixels}/{total_pixels} ({100*transparent_pixels/total_pixels:.1f}%)")


def main():
    input_dir = os.path.join(os.path.dirname(__file__), "..", "public", "images")
    output_dir = input_dir  # Output alongside inputs

    for filename in sorted(os.listdir(input_dir)):
        if not filename.endswith(".jpg"):
            continue

        input_path = os.path.join(input_dir, filename)
        output_name = filename.replace(".jpg", ".png")
        output_path = os.path.join(output_dir, output_name)

        print(f"Processing {filename} -> {output_name}")

        # Image 01 has a dark bg, needs different tolerance
        bg_sample = np.array(Image.open(input_path).convert("RGB"))[0, 0]
        is_dark = np.mean(bg_sample) < 128
        tol = 20 if is_dark else 30

        remove_checkered_bg(input_path, output_path, tolerance=tol)

    print("\nDone! All PNGs saved to", input_dir)


if __name__ == "__main__":
    main()
