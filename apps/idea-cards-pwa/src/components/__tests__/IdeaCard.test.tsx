import { render, screen, fireEvent } from '@testing-library/react';
import { IdeaCard } from '../IdeaCard';
import { ThemeProvider } from '../ThemeProvider';

const mockIdea = {
  id: '1',
  title: 'Test Idea',
  description: 'This is a test idea description',
  category: 'Technology',
  tags: ['test', 'idea'],
  marketSize: 'Large',
  difficulty: 'Medium',
  timeToMarket: '6-12 months',
  confidenceScore: 85,
};

const mockOnAnalyze = jest.fn();

describe('IdeaCard', () => {
  beforeEach(() => {
    mockOnAnalyze.mockClear();
  });

  it('renders idea information correctly', () => {
    render(
      <ThemeProvider>
        <IdeaCard idea={mockIdea} onAnalyze={mockOnAnalyze} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Idea')).toBeInTheDocument();
    expect(screen.getByText('This is a test idea description')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('6-12 months')).toBeInTheDocument();
  });

  it('displays confidence score', () => {
    render(
      <ThemeProvider>
        <IdeaCard idea={mockIdea} onAnalyze={mockOnAnalyze} />
      </ThemeProvider>
    );
    
    expect(screen.getByText(/85%/i)).toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    render(
      <ThemeProvider>
        <IdeaCard idea={mockIdea} onAnalyze={mockOnAnalyze} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('idea')).toBeInTheDocument();
  });

  it('calls onAnalyze when analyze button is clicked', () => {
    render(
      <ThemeProvider>
        <IdeaCard idea={mockIdea} onAnalyze={mockOnAnalyze} />
      </ThemeProvider>
    );
    
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);
    
    expect(mockOnAnalyze).toHaveBeenCalledWith(mockIdea);
  });

  it('has proper card structure', () => {
    render(
      <ThemeProvider>
        <IdeaCard idea={mockIdea} onAnalyze={mockOnAnalyze} />
      </ThemeProvider>
    );
    
    const card = screen.getByTestId(`idea-card-${mockIdea.id}`);
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('cursor-pointer');
  });
});