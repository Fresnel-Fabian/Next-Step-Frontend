export interface PollOption {
  label: string;
  votes: number;
  percentage: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creator: string;
  timeLeft: string;
  totalVotes: number;
  status: 'active' | 'completed';
  voted: boolean;
}