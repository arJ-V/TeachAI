import cv2
import tempfile
import os
from contextlib import contextmanager

# Replace this import with the correct library if "libreface" isn't the right name
try:
    import libreface
except ImportError:
    print("Error: libreface library not found. Please install it first.")
    exit(1)

@contextmanager
def camera_capture(camera_index=0):
    """Context manager for handling camera resources properly"""
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open camera at index {camera_index}")
    try:
        yield cap
    finally:
        cap.release()

# Main processing function
def process_video():
    max_frames = 100  # Number of frames to process
    
    # Create temporary file that will be automatically cleaned up
    with tempfile.NamedTemporaryFile(suffix='.avi', delete=False) as temp_video:
        video_path = temp_video.name
    
    try:
        # Set up video writer
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        
        # Open webcam with context manager
        with camera_capture(0) as cap:
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            out = cv2.VideoWriter(video_path, fourcc, 20.0, (width, height))
            
            frame_count = 0
            while frame_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                out.write(frame)
                cv2.imshow('Webcam', frame)
                
                # Break loop on 'q' press
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
                frame_count += 1
                
            out.release()
            cv2.destroyAllWindows()
        
        # Process the captured video with LibreFace
        try:
            results = libreface.get_facial_attributes(video_path, batch_size=32, num_workers=2)
            print(results)
        except Exception as e:
            print(f"Error processing video with libreface: {e}")
    
    finally:
        # Clean up the temporary file
        if os.path.exists(video_path):
            os.unlink(video_path)

if __name__ == "__main__":
    process_video()
