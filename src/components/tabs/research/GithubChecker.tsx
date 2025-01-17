import React, { useState } from 'react';
import { TabItemProps } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Star } from 'lucide-react';

interface AnalysisResult {
  category: string;
  score: number;
  description: string;
}

interface ApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ParsedResponse {
  results: AnalysisResult[];
}

interface RepositoryDetails {
  name: string;
  owner: string;
  stars: number;
  forks: number;
  watchers: number;
  issues: number;
  pullRequests: number;
  language: string;
  description: string;
  url: string;
}


const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const fetchGithubData = async (owner: string, repo: string): Promise<RepositoryDetails> => {
  
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

  if (!response.ok) {
    throw new Error("Failed to fetch repository details");
  }

  const data = await response.json();
  return {
    name: data.name,
    owner: data.owner.login,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.watchers_count,
    issues: data.open_issues_count,
    pullRequests: data.pulls_url ? data.pulls_url.length : 0,
    language: data.language,
    description: data.description,
    url: data.html_url,
  };
};
const GithubChecker: React.FC<TabItemProps> = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [repoDetails, setRepoDetails] = useState<RepositoryDetails | null>(null);
  const [rating, setRating] = useState<number>(0);
const [hasRated, setHasRated] = useState(false);
const [showRating, setShowRating] = useState(false);
  const validateGithubUrl = (url: string): boolean => {
    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubUrlPattern.test(url);
  };

  const extractRepoInfo = (url: string): string => {
    const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
    return match ? match[1].replace(/\/$/, '') : '';
  };

  const extractRepoInfo1 = (url: string): { owner: string; repo: string } => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return { owner: "", repo: "" };
  };

  const handleAnalyze = async () => {
    if (!OPENAI_API_KEY) {
      setError('OpenAI API key is not configured');
      return;
    }

    if (!validateGithubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setIsLoading(true);
    setError('');
    const { owner, repo } = extractRepoInfo1(repoUrl);
    const repoData = await fetchGithubData(owner, repo);
      setRepoDetails(repoData);
    try {
      const repoInfo = extractRepoInfo(repoUrl);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a code analysis expert. Analyze GitHub repositories and provide scores and descriptions."
            },
            {
              role: "user",
              content: `Analyze the GitHub repository ${repoInfo} and provide the following analysis in JSON format.
              Include these categories:
              - Code Quality
              - Architecture
              - Performance
              - Documentation
              - Testing
              - Security
              - Maintainability
              - Dependencies
              
              For each category, provide:
              1. A score from 0-100
              2. A brief description (2-3 sentences)
              
              Format the response as:
              {
                "results": [
                  {
                    "category": "Category Name",
                    "score": number,
                    "description": "Description text"
                  }
                ]
              }`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to analyze repository');
      }

      const data: ApiResponse = await response.json();
      
      let parsedResults: ParsedResponse;
      try {
        parsedResults = JSON.parse(data.choices[0].message.content);
        
        if (!parsedResults.results || !Array.isArray(parsedResults.results)) {
          throw new Error('Invalid response structure');
        }

        const validatedResults = parsedResults.results.map((result: any): AnalysisResult => ({
          category: String(result.category || 'Unknown'),
          score: Math.min(100, Math.max(0, Number(result.score) || 0)),
          description: String(result.description || 'No description provided')
        }));

        setAnalysisResults(validatedResults);
        setShowRating(true);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        setError('Failed to parse analysis results. Please try again.');
      }
    } catch (err) {
      console.error('API error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-bold text-[#B1B762]">GitHub Repository Analyzer</h3>
      
      <div className="space-y-4">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="Enter GitHub repository URL (e.g., https://github.com/user/repo)"
          className="w-full p-2 bg-black border border-[#B1B762] rounded text-white"
        />

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          className="bg-[#B1B762] text-black px-4 py-2 rounded hover:bg-opacity-80 flex items-center justify-center gap-2 w-full"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="animate-spin" size={20} />}
          {isLoading ? 'Analyzing Repository...' : 'Analyze Repository'}
        </button>
      </div>
      {repoDetails && showRating && (
        <div className="p-4 border border-[#B1B762] rounded space-y-4 text-[#B1B762]">
          <h4 className="font-semibold text-lg">
            <a href={repoDetails.url} target="_blank" rel="noopener noreferrer">
              {repoDetails.name}
            </a>
          </h4>
          <p>{repoDetails.description}</p>
          <p>
            <strong>Stars:</strong> {repoDetails.stars} | <strong>Forks:</strong> {repoDetails.forks}
          </p>
          <div className="mt-4 border-t border-[#B1B762] pt-4">
      <p className="text-[#B1B762] mb-2">Rate this analysis:</p>
      <div className="flex items-center gap-2">
        {!hasRated ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setRating(star);
                  setHasRated(true);
                }}
                onMouseEnter={() => setRating(star)}
                onMouseLeave={() => setRating(0)}
                className="focus:outline-none transition-transform hover:scale-105"
                disabled={hasRated}
              >
                <Star
                  size={24}
                  fill={star <= rating ? "#B1B762" : "transparent"}
                  stroke="#B1B762"
                  className="transition-colors duration-200"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                fill={star <= rating ? "#B1B762" : "transparent"}
                stroke="#B1B762"
                className="transition-colors duration-200"
              />
            ))}
          </div>
        )}
      </div>
      {hasRated ? (
        <p className="text-sm text-[#B1B762] mt-2">
          Thanks for rating this analysis!
        </p>
      ) : (
        <p className="text-sm text-[#B1B762] mt-2 min-h-[20px]">
          {rating > 0 ? `Your rating: ${rating} stars` : "Hover to rate"}
        </p>
      )}
    </div>
  </div>
)}
      {analysisResults.length > 0 && (
        <div className="mt-8 space-y-6 text-[#B1B762]">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisResults}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#B1B762" name="Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {analysisResults.map((result, index) => (
              <div key={index} className="p-4 border border-[#B1B762] rounded">
                <h5 className="font-semibold">{result.category}</h5>
                <div className="mt-2 text-sm">Score: {result.score}/100</div>
                <p className="mt-2 text-sm">{result.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubChecker;
