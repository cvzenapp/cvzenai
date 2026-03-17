# AI Service Configuration

This document explains how to configure and switch between different AI services (Groq and OpenAI) for resume parsing and other AI-powered features.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# AI Service Configuration - Choose between GROQ or OPENAI
AI_SERVICE=GROQ

# OpenAI Configuration (for AI-powered features - Premium)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Groq API Configuration (for AI-powered features)
GROQ_API_KEY=your-groq-api-key
```

### Supported Values

- `AI_SERVICE=GROQ` - Use Groq API (default, faster, cost-effective)
- `AI_SERVICE=OPENAI` - Use OpenAI API (higher quality, more expensive)

## Features

### Automatic Service Selection
The system automatically uses the service specified in `AI_SERVICE` environment variable.

### Model Mapping
Different AI services use different model names. The abstracted service automatically maps models:

| Requested Model | Groq Model | OpenAI Model |
|----------------|------------|--------------|
| `llama-3.1-8b-instant` | `llama-3.1-8b-instant` | `gpt-4o-mini` |
| `llama-3.1-70b-versatile` | `llama-3.1-70b-versatile` | `gpt-4o-mini` |
| `default` | `llama-3.1-8b-instant` | `gpt-4o-mini` |

### Automatic Fallback
If the primary service fails, the system automatically attempts to use the alternative service.

### Runtime Switching
For testing purposes, you can switch services at runtime:

```javascript
import { abstractedAiService } from './server/services/abstractedAiService.js';

// Switch to OpenAI
abstractedAiService.switchService('OPENAI');

// Switch to Groq
abstractedAiService.switchService('GROQ');

// Check current service
console.log(abstractedAiService.getCurrentService());
```

## Usage in Resume Parsing

The resume parser now uses the abstracted AI service automatically. No code changes are needed - just set the `AI_SERVICE` environment variable.

```javascript
// This automatically uses the configured AI service
const result = await resumeParser.parseResume(resumeText);
```

## Testing

The AI service switching has been tested and verified to work correctly:

- ✅ **GROQ Service**: Uses `llama-3.1-8b-instant` model
- ✅ **OpenAI Service**: Uses `gpt-4o-mini` model  
- ✅ **Model Mapping**: Automatically maps between service-specific models
- ✅ **Service Switching**: Runtime switching between services works
- ✅ **Fallback**: Automatic fallback to alternative service on failure

To test manually, you can create a simple script:

```javascript
import { abstractedAiService } from './server/services/abstractedAiService.js';

const response = await abstractedAiService.generateResponse({
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: 'Hello, which AI service are you?',
  options: { temperature: 0, maxTokens: 50 }
});

console.log(response.response);
```

## Benefits

1. **Flexibility**: Switch between AI providers without code changes
2. **Reliability**: Automatic fallback if primary service fails
3. **Cost Optimization**: Use Groq for cost-effective processing, OpenAI for premium quality
4. **Easy Migration**: Seamlessly migrate between services
5. **Development vs Production**: Use different services for different environments

## Migration from Direct Groq Usage

The system has been updated to use the abstracted service. All existing functionality remains the same, but now you can switch AI providers via environment configuration.

### Before
```javascript
import { groqService } from './groqService.js';
const response = await groqService.generateResponse(systemPrompt, userPrompt, options);
```

### After
```javascript
import { abstractedAiService } from './abstractedAiService.js';
const response = await abstractedAiService.generateResponse({
  systemPrompt,
  userPrompt,
  options
});
```

## Troubleshooting

### Service Not Available
If you get service availability errors:
1. Check your API keys are correctly set
2. Verify the `AI_SERVICE` environment variable is set correctly
3. Ensure you have network connectivity
4. Check API quotas and rate limits

### Model Not Found
If you get model not found errors:
1. The system automatically maps models between services
2. Check the model mapping table above
3. Ensure your API keys have access to the required models

### Fallback Not Working
If fallback fails:
1. Ensure both `GROQ_API_KEY` and `OPENAI_API_KEY` are set
2. Check that both services are accessible
3. Review the console logs for detailed error messages