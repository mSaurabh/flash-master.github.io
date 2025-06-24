# ⚡ FlashMaster

A modern, interactive flashcard and quiz learning platform with progress tracking and analytics.

## 🚀 Quick Start

### File Structure
```
flashmaster/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styling
├── app.js              # JavaScript application logic
└── README.md           # This file
```

### Setup Instructions

1. **Download all files** to a single folder
2. **Open with Live Server** in VS Code:
   - Install the "Live Server" extension
   - Right-click on `index.html`
   - Select "Open with Live Server"
3. **Or use any local server** (Python, Node.js, etc.)

⚠️ **Important**: The app must be served from a local server (not opened directly as a file) for full functionality.

## 📋 Features

### 🎯 Study Modes
- **Flashcard Mode**: Interactive card flipping with difficulty-based colors
- **Quiz Mode**: Single/multiple choice questions with instant feedback
- **Timed Quizzes**: Challenge yourself with time limits

### 📊 Progress Tracking
- **Visual Analytics**: Charts showing performance over time
- **Session Statistics**: Track accuracy, passing rates, and trends
- **Export/Import**: Save and restore progress data

### ⚙️ Customization
- **Difficulty Colors**: Easy (🟢), Medium (🔵), Hard (🟠), Expert (🔴)
- **Passing Thresholds**: Set your own success criteria
- **Card Shuffling**: Randomize or keep sequential order

## 🔒 Security Features

### Content Security Policy (CSP) Compliance
FlashMaster is built with security in mind:

- **No inline JavaScript**: All event handlers use proper event listeners
- **CSP-compliant**: No use of `eval()`, `new Function()`, or string-based timeouts
- **External script validation**: Only trusted CDN sources (Chart.js)
- **Safe data handling**: All user data is sanitized and stored locally

### Security Headers
The app includes a CSP meta tag:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdnjs.cloudflare.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:; 
               font-src 'self' https:;">
```

### 🎯 Study Modes
- **Flashcard Mode**: Interactive card flipping with difficulty-based colors
- **Quiz Mode**: Single/multiple choice questions with instant feedback
- **Timed Quizzes**: Challenge yourself with time limits

### 📊 Progress Tracking
- **Visual Analytics**: Charts showing performance over time
- **Session Statistics**: Track accuracy, passing rates, and trends
- **Export/Import**: Save and restore progress data

### ⚙️ Customization
- **Difficulty Colors**: Easy (🟢), Medium (🔵), Hard (🟠), Expert (🔴)
- **Passing Thresholds**: Set your own success criteria
- **Card Shuffling**: Randomize or keep sequential order

## 📁 JSON Format

Create flashcard sets using this JSON structure:

```json
{
  "topic": "Your Topic Name",
  "description": "Brief description of the content",
  "cards": [
    {
      "id": 1,
      "question": "Your question here?",
      "answer": "The answer explanation",
      "difficulty": "easy",
      "choices": [
        "Option A",
        "Option B", 
        "Option C",
        "Option D"
      ],
      "correctChoices": [0, 2]
    }
  ]
}
```

### Field Definitions
- **`topic`**: Main subject (displayed in header)
- **`description`**: Optional detailed description
- **`question`**: The question to display
- **`answer`**: Answer for flashcard mode
- **`difficulty`**: `"easy"`, `"medium"`, `"hard"`, or `"expert"`
- **`choices`**: Array of options for quiz mode
- **`correctChoices`**: Array of indices for correct answers (supports multiple)

## 🎨 Architecture

### HTML (`index.html`)
- Clean semantic structure
- Embedded favicon (Base64 SVG)
- External script/style references
- Responsive layout containers

### CSS (`styles.css`)
- Modern glassmorphism design
- Dark theme with vibrant accents
- Responsive breakpoints
- Smooth animations and transitions
- Confetti animation system

### JavaScript (`app.js`)
- Modular function organization
- Local storage for persistence
- Chart.js integration for analytics
- Drag & drop file handling
- Comprehensive error handling

## 🔧 Customization

### Colors
Modify the CSS custom properties in `styles.css`:
```css
/* Primary gradient */
--primary-gradient: linear-gradient(135deg, #00F5FF 0%, #FFD700 100%);

/* Difficulty colors */
--easy-color: #10B981;
--medium-color: #3B82F6;
--hard-color: #F59E0B;
--expert-color: #EF4444;
```

### Settings
Default settings in `app.js`:
```javascript
let settings = {
    passingThreshold: 70,    // Minimum % to pass
    shuffleCards: true,      // Randomize card order
    quizTimeLimit: 60        // Seconds for timed quizzes
};
```

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Features Used**: ES6+, CSS Grid, Flexbox, Local Storage
- **Dependencies**: Chart.js (CDN)

## 🚀 Deployment

### Local Development
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

### Production
- Upload all files to web server
- Ensure proper MIME types for `.js` and `.css`
- No build process required

## 🎯 Usage Tips

1. **Create Study Sets**: Start with 10-20 cards per topic
2. **Use Progressive Difficulty**: Mix easy and hard questions
3. **Regular Sessions**: Short, frequent study sessions work best
4. **Track Progress**: Use analytics to identify weak areas
5. **Export Data**: Backup your progress regularly

## 🔄 Updates

To update the application:
1. Replace individual files as needed
2. Clear browser cache if styles don't update
3. Check browser console for any errors

## 📞 Support

For issues or questions:
- Check browser console for error messages
- Ensure all files are in the same directory
- Verify JSON format using a validator
- Test with a simple flashcard set first

---

**Made with ⚡ by FlashMaster** - Happy Learning! 🎓
