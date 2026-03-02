import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ImageUpload from './ImageUpload';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  onload: null as any,
  onerror: null as any,
  onprogress: null as any,
  result: null as any,
};

global.FileReader = vi.fn(() => mockFileReader) as any;

// Mock canvas and image for compression
const mockCanvas = {
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
  })),
  toBlob: vi.fn(),
  width: 0,
  height: 0,
};

global.HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
global.HTMLCanvasElement.prototype.toBlob = mockCanvas.toBlob;

const mockImage = {
  onload: null as any,
  onerror: null as any,
  src: '',
  width: 800,
  height: 600,
};

global.Image = vi.fn(() => mockImage) as any;

describe('ImageUpload', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    images: [],
    onChange: mockOnChange,
    maxImages: 5,
    maxSizeInMB: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader.result = null;
  });

  it('renders upload area when no images are present', () => {
    render(<ImageUpload {...defaultProps} />);
    
    expect(screen.getByText('Upload Images')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop images here, or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Choose Images')).toBeInTheDocument();
  });

  it('displays existing images', () => {
    const images = ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'];
    render(<ImageUpload {...defaultProps} images={images} />);
    
    expect(screen.getByText('Uploaded Images (2)')).toBeInTheDocument();
    expect(screen.getAllByAltText(/Project image/)).toHaveLength(2);
  });

  it('shows cover badge on first image when multiple images exist', () => {
    const images = ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'];
    render(<ImageUpload {...defaultProps} images={images} />);
    
    expect(screen.getByText('Cover')).toBeInTheDocument();
  });

  it('validates file types correctly', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<ImageUpload {...defaultProps} />);
    
    const fileInput = screen.getByRole('button', { name: /choose images/i }).parentElement?.querySelector('input[type="file"]');
    
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    }
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('File type not supported'));
    });
    
    alertSpy.mockRestore();
  });

  it('validates file size correctly', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<ImageUpload {...defaultProps} maxSizeInMB={1} />);
    
    const fileInput = screen.getByRole('button', { name: /choose images/i }).parentElement?.querySelector('input[type="file"]');
    
    // Create a file larger than 2MB (since we allow 2x the target size)
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
    }
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('File size too large'));
    });
    
    alertSpy.mockRestore();
  });

  it('validates maximum image count', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    const existingImages = ['img1', 'img2', 'img3', 'img4', 'img5'];
    render(<ImageUpload {...defaultProps} images={existingImages} maxImages={5} />);
    
    const fileInput = screen.getByRole('button', { name: /choose images/i }).parentElement?.querySelector('input[type="file"]');
    
    const newFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [newFile] } });
    }
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Maximum 5 images allowed'));
    });
    
    alertSpy.mockRestore();
  });

  it('removes images correctly', () => {
    const images = ['img1', 'img2', 'img3'];
    render(<ImageUpload {...defaultProps} images={images} />);
    
    const removeButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.getAttribute('class')?.includes('text-red-600')
    );
    
    fireEvent.click(removeButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith(['img2', 'img3']);
  });

  it('moves image to front when drag handle is clicked', () => {
    const images = ['img1', 'img2', 'img3'];
    render(<ImageUpload {...defaultProps} images={images} />);
    
    // Find drag handle buttons (they have Move3D icon)
    const dragHandles = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.getAttribute('class')?.includes('cursor-move')
    );
    
    // Click the drag handle of the second image (index 1)
    fireEvent.mouseDown(dragHandles[1]);
    
    expect(mockOnChange).toHaveBeenCalledWith(['img2', 'img1', 'img3']);
  });

  it('handles drag and drop correctly', async () => {
    render(<ImageUpload {...defaultProps} />);
    
    const dropZone = screen.getByText('Upload Images').closest('div');
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (dropZone) {
      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [file] }
      });
      
      expect(dropZone).toHaveClass('border-blue-500');
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });
    }
    
    // Should process the file
    expect(global.FileReader).toHaveBeenCalled();
  });

  it('shows upload progress during file processing', async () => {
    render(<ImageUpload {...defaultProps} />);
    
    const fileInput = screen.getByRole('button', { name: /choose images/i }).parentElement?.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }
    
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
  });

  it('displays upload stats correctly', () => {
    const images = ['img1', 'img2'];
    render(<ImageUpload {...defaultProps} images={images} maxImages={5} />);
    
    expect(screen.getByText('2 uploaded')).toBeInTheDocument();
    expect(screen.getByText('3 remaining')).toBeInTheDocument();
  });

  it('hides upload area when maximum images reached', () => {
    const images = ['img1', 'img2', 'img3', 'img4', 'img5'];
    render(<ImageUpload {...defaultProps} images={images} maxImages={5} />);
    
    expect(screen.queryByText('Upload Images')).not.toBeInTheDocument();
    expect(screen.queryByText('Choose Images')).not.toBeInTheDocument();
  });

  it('opens image in new tab when view button is clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    
    const images = ['data:image/jpeg;base64,test1'];
    render(<ImageUpload {...defaultProps} images={images} />);
    
    const viewButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && !btn.getAttribute('class')?.includes('text-red-600')
    );
    
    fireEvent.click(viewButtons[0]);
    
    expect(windowOpenSpy).toHaveBeenCalledWith('data:image/jpeg;base64,test1', '_blank');
    
    windowOpenSpy.mockRestore();
  });
});