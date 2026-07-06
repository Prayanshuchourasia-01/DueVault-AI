import { useState } from 'react';

export const useGeminiParser = () => {
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  const getApiKey = () => {
    const savedKeyBase64 = localStorage.getItem('duevault_gemini_key');
    if (!savedKeyBase64) {
      throw new Error('Gemini API Key is missing. Please add your key in Settings.');
    }
    try {
      return atob(savedKeyBase64);
    } catch (e) {
      return savedKeyBase64;
    }
  };

  const parseTaskText = async (text) => {
    const apiKey = getApiKey();

    setIsParsing(true);
    setParseError(null);

    const now = new Date();
    
    // Construct temporal reference context for Gemini
    const timeContext = `
You are DueVault AI's temporal parsing engine. Your job is to extract scheduling intent from natural language input.
Today is ${now.toLocaleDateString('en-CA')} (YYYY-MM-DD).
Current local time is ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}.
Day of week is ${now.toLocaleDateString(undefined, { weekday: 'long' })}.

Instructions:
1. Parse the user prompt and extract a single schedule item.
2. Output ONLY a valid JSON object matching the requested schema. Do not wrap in markdown code blocks like \`\`\`json.
3. Compute the 'date' as YYYY-MM-DD. If the user mentions "tomorrow" or a specific day of the week, calculate the exact YYYY-MM-DD. If no day is mentioned, default to today.
4. Compute 'start' and 'end' times in "HH:MM" 24-hour format. If no end time is specified, default to 1 hour after start.
5. Extract 'reminderTime' if the user asks for a specific exact alarm time (HH:MM).
6. Extract a dynamic 'category'. DO NOT hardcode this list, but examples include: study, finance, fitness, hackathon, chores, bills, coding, class. Be concise (one or two words).
7. Assess 'priority' into one of 4 tiers: "LOW", "MEDIUM", "HIGH", "CRITICAL".
   - CRITICAL: Major exams, hard deadlines, urgent bill payments.
   - HIGH: Assignments, standard bills, important meetings.
   - MEDIUM: Regular study blocks, coding practice, fitness.
   - LOW: Chores, routine tasks, breaks, chill time.
`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `User request to schedule: "${text}"` }]
          }
        ],
        systemInstruction: {
          parts: [{ text: timeContext }]
        },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING', description: 'Short title of the task.' },
              category: { type: 'STRING', description: 'Dynamic short category (e.g. study, finance, fitness, hackathon, etc.)' },
              date: { type: 'STRING', description: 'Scheduled date in YYYY-MM-DD format.' },
              start: { type: 'STRING', description: 'Start time in 24h format HH:MM' },
              end: { type: 'STRING', description: 'End time in 24h format HH:MM' },
              reminderTime: { type: 'STRING', description: 'Exact time to trigger a reminder alarm in HH:MM format (optional).' },
              priority: { type: 'STRING', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], description: 'Priority tier' }
            },
            required: ['title', 'category', 'date', 'start', 'end', 'priority']
          }
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResult) {
        throw new Error('Gemini API returned an empty response. Please check your query.');
      }

      const parsedTask = JSON.parse(textResult);
      
      if (!parsedTask.title || !parsedTask.start || !parsedTask.end || !parsedTask.date || !parsedTask.category || !parsedTask.priority) {
        throw new Error('Parsed response does not contain all required fields.');
      }

      setIsParsing(false);
      return parsedTask;

    } catch (err) {
      console.error('Error during Gemini NLP parse:', err);
      const errMsg = err.message || 'Unknown network error. Check your connection and API key.';
      setParseError(errMsg);
      setIsParsing(false);
      throw new Error(errMsg);
    }
  };

  const parseHTMLSchedule = async (htmlText) => {
    const apiKey = getApiKey();
    setIsParsing(true);
    setParseError(null);

    const timeContext = `
You are DueVault AI's batch parsing engine. Your job is to extract weekly timetable/schedule data from raw HTML content.
Today is ${new Date().toLocaleDateString('en-CA')} (YYYY-MM-DD).

Instructions:
1. Extract EVERY SINGLE schedule event, class, lab, or weekly routine found in the HTML. Do not skip any item, no matter how many there are. You MUST be exhaustive.
2. Output ONLY a valid JSON array of objects matching the schema. Do not wrap in markdown code blocks like \`\`\`json.
3. Compute 'dayOfWeek' as a string (e.g., "Monday", "Tuesday"). Do NOT extract specific dates.
4. Compute 'start' and 'end' times in "HH:MM" 24-hour format. If no end time is specified, assume it is 1 hour after start.
5. Provide a dynamic 'category' (e.g. class, lab, study) for each.
`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: `Extract weekly recurring schedule from HTML: ${htmlText.substring(0, 50000)}` }] }],
        systemInstruction: { parts: [{ text: timeContext }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                category: { type: 'STRING' },
                dayOfWeek: { type: 'STRING', description: 'Monday, Tuesday, etc.' },
                start: { type: 'STRING', description: 'HH:MM' },
                end: { type: 'STRING', description: 'HH:MM' }
              },
              required: ['title', 'category', 'dayOfWeek', 'start', 'end']
            }
          }
        }
      };

      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      
      const data = await response.json();
      const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResult) throw new Error('Empty response from Gemini.');
      
      const parsedArray = JSON.parse(textResult);
      setIsParsing(false);
      return Array.isArray(parsedArray) ? parsedArray : [];
      
    } catch (err) {
      console.error(err);
      setParseError(err.message || 'Unknown network error.');
      setIsParsing(false);
      throw err;
    }
  };

  return {
    isParsing,
    parseError,
    parseTaskText,
    parseHTMLSchedule
  };
};
