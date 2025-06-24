/**
 * FlashMaster Application
 * Interactive flashcard and quiz learning platform
 */

// ==========================================================================
// Global Variables
// ==========================================================================

let flashcards = [];
let currentCardIndex = 0;
let isFlipped = false;
let currentMode = 'flashcard';
let quizMode = 'single';
let selectedAnswers = [];
let quizTimer = null;
let timeLeft = 60;
let timerStarted = false;
let quizCompleted = false;

let sessionStats = {
    correct: 0,
    total: 0,
    answers: []
};

let quizStats = {
    correct: 0,
    total: 0,
    answers: [],
    startTime: null,
    endTime: null
};

let progressData = JSON.parse(localStorage.getItem('flashcardProgress') || '[]');
let settings = JSON.parse(localStorage.getItem('flashcardSettings') || '{"passingThreshold": 70, "shuffleCards": true, "quizTimeLimit": 60}');

// ==========================================================================
// Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    updateProgressChart();
    updateProgressStats();
    
    // Initialize content visibility safely
    if (flashcards.length === 0) {
        const studyContent = document.getElementById('studyContent');
        const noCardsMessage = document.getElementById('noCardsMessage');
        const quizContent = document.getElementById('quizContent');
        const noQuizMessage = document.getElementById('noQuizMessage');
        
        if (studyContent) studyContent.style.display = 'none';
        if (noCardsMessage) noCardsMessage.style.display = 'block';
        if (quizContent) quizContent.style.display = 'none';
        if (noQuizMessage) noQuizMessage.style.display = 'block';
    }
    
    // Set up drag and drop
    setupDragAndDrop();
    
    // Set up all event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName, e);
        });
    });

    // File upload
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    if (fileInput) {
        fileInput.addEventListener('change', loadFlashcards);
    }
    
    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', function() {
            document.getElementById('fileInput').click();
        });
    }

    // Study mode buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const mode = this.getAttribute('data-mode');
            setStudyMode(mode, e);
        });
    });

    // Flashcard interactions
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
        flashcard.addEventListener('click', flipCard);
    }

    // Study control buttons
    const correctBtn = document.getElementById('correctBtn');
    const incorrectBtn = document.getElementById('incorrectBtn');
    const nextBtn = document.getElementById('nextBtn');
    const restartSessionBtn = document.getElementById('restartSessionBtn');

    if (correctBtn) {
        correctBtn.addEventListener('click', function() {
            markAnswer(true);
        });
    }

    if (incorrectBtn) {
        incorrectBtn.addEventListener('click', function() {
            markAnswer(false);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextCard);
    }

    if (restartSessionBtn) {
        restartSessionBtn.addEventListener('click', restartSession);
    }

    // Quiz mode buttons
    document.querySelectorAll('[data-quiz-mode]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const mode = this.getAttribute('data-quiz-mode');
            setQuizMode(mode, e);
        });
    });

    // Quiz control buttons
    const startTimedQuizBtn = document.getElementById('startTimedQuizBtn');
    const quizSubmitBtn = document.getElementById('quizSubmitBtn');
    const quizNextBtn = document.getElementById('quizNextBtn');
    const restartQuizBtn = document.getElementById('restartQuizBtn');
    const downloadQuizResultsBtn = document.getElementById('downloadQuizResultsBtn');

    if (startTimedQuizBtn) {
        startTimedQuizBtn.addEventListener('click', startTimedQuiz);
    }

    if (quizSubmitBtn) {
        quizSubmitBtn.addEventListener('click', submitQuizAnswer);
    }

    if (quizNextBtn) {
        quizNextBtn.addEventListener('click', nextQuizQuestion);
    }

    if (restartQuizBtn) {
        restartQuizBtn.addEventListener('click', restartQuiz);
    }

    if (downloadQuizResultsBtn) {
        downloadQuizResultsBtn.addEventListener('click', downloadQuizResults);
    }

    // Progress buttons
    const exportProgressBtn = document.getElementById('exportProgressBtn');
    const importProgressBtn = document.getElementById('importProgressBtn');
    const clearProgressBtn = document.getElementById('clearProgressBtn');
    const progressImport = document.getElementById('progressImport');

    if (exportProgressBtn) {
        exportProgressBtn.addEventListener('click', exportProgress);
    }

    if (importProgressBtn) {
        importProgressBtn.addEventListener('click', function() {
            document.getElementById('progressImport').click();
        });
    }

    if (clearProgressBtn) {
        clearProgressBtn.addEventListener('click', clearProgress);
    }

    if (progressImport) {
        progressImport.addEventListener('change', importProgress);
    }

    // Settings button
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Tab switching buttons (for upload cards buttons)
    document.querySelectorAll('[data-tab]:not(.nav-tab)').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName, e);
        });
    });
}

function setupDragAndDrop() {
    const uploadArea = document.querySelector('.file-upload');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 215, 0, 0.6)';
        uploadArea.style.background = 'rgba(255, 215, 0, 0.05)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        uploadArea.style.borderColor = 'rgba(0, 245, 255, 0.4)';
        uploadArea.style.background = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(0, 245, 255, 0.4)';
        uploadArea.style.background = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/json') {
                loadFlashcardsFromFile(file);
            } else {
                showMessage('Please upload a JSON file!', 'error');
            }
        }
    });
}

// ==========================================================================
// Navigation and UI
// ==========================================================================

function switchTab(tabName, event = null) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    
    // If called from an event, use event.target, otherwise find the tab by content
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Find the correct nav tab based on the tab name
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            const tabText = tab.textContent.toLowerCase();
            if ((tabName === 'upload' && tabText.includes('upload')) ||
                (tabName === 'study' && tabText.includes('study')) ||
                (tabName === 'quiz' && tabText.includes('quiz')) ||
                (tabName === 'progress' && tabText.includes('analytics')) ||
                (tabName === 'settings' && tabText.includes('settings'))) {
                tab.classList.add('active');
            }
        });
    }
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Update progress chart when switching to progress tab
    if (tabName === 'progress') {
        updateProgressChart();
        updateProgressStats();
    }
}

function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = type === 'error' ? 'error-message' : 'success-message';
    message.textContent = text;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (document.body.contains(message)) {
            document.body.removeChild(message);
        }
    }, 4000);
}

// ==========================================================================
// File Loading and Processing
// ==========================================================================

function loadFlashcards(event) {
    const file = event.target.files[0];
    if (file) {
        loadFlashcardsFromFile(file);
    }
}

function loadFlashcardsFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.cards || !Array.isArray(data.cards)) {
                throw new Error('Invalid JSON format - missing cards array');
            }
            
            flashcards = data.cards.map(card => ({
                ...card,
                difficulty: card.difficulty || 'medium'
            }));
            
            if (settings.shuffleCards) {
                shuffleArray(flashcards);
            }
            
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                resetSession();
                resetQuiz();
                updateCurrentTopic(data.topic || 'Unknown Topic', data.description);
                showMessage(`Successfully loaded ${flashcards.length} flashcards!`, 'success');
                
                // Switch to study tab
                switchTab('study');
            }, 100);
            
        } catch (error) {
            console.error('JSON loading error:', error);
            showMessage('Error loading JSON file: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        showMessage('Error reading file', 'error');
    };
    
    reader.readAsText(file);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateCurrentTopic(topic, description) {
    const topicElement = document.getElementById('currentTopic');
    if (topicElement) {
        topicElement.innerHTML = `
            <strong>${topic}</strong><br>
            <small style="color: rgba(228, 228, 231, 0.7);">${description || 'No description provided'}</small>
        `;
    }
}

// ==========================================================================
// Flashcard Study Mode
// ==========================================================================

function setStudyMode(mode, event = null) {
    currentMode = mode;
    document.querySelectorAll('#study .mode-btn').forEach(btn => btn.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Find the correct button based on mode
        document.querySelectorAll('#study .mode-btn').forEach(btn => {
            const btnText = btn.textContent.toLowerCase();
            if (mode === 'flashcard' && btnText.includes('flashcard')) {
                btn.classList.add('active');
            }
        });
    }
}

function resetSession() {
    currentCardIndex = 0;
    isFlipped = false;
    sessionStats = {
        correct: 0,
        total: 0,
        answers: []
    };
    
    const studyContent = document.getElementById('studyContent');
    const noCardsMessage = document.getElementById('noCardsMessage');
    const sessionComplete = document.getElementById('sessionComplete');
    
    if (studyContent) studyContent.style.display = 'block';
    if (noCardsMessage) noCardsMessage.style.display = 'none';
    if (sessionComplete) sessionComplete.style.display = 'none';
    
    updateSessionStats();
    updateCard();
}

function updateCard() {
    if (currentCardIndex >= flashcards.length) {
        completeSession();
        return;
    }
    
    const card = flashcards[currentCardIndex];
    
    // Safely update text content
    const questionText = document.getElementById('questionText');
    const answerText = document.getElementById('answerText');
    if (questionText) questionText.textContent = card.question;
    if (answerText) answerText.textContent = card.answer;
    
    // Update card colors based on difficulty
    const cardFront = document.getElementById('cardFront');
    const cardBack = document.getElementById('cardBack');
    
    if (cardFront) {
        cardFront.className = `card-face card-front ${card.difficulty}`;
    }
    if (cardBack) {
        cardBack.className = `card-face card-back ${card.difficulty}`;
    }
    
    // Update difficulty indicator
    const difficultyIndicator = document.getElementById('difficultyIndicator');
    if (difficultyIndicator) {
        difficultyIndicator.textContent = card.difficulty.toUpperCase();
    }
    
    // Reset card flip
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
        flashcard.classList.remove('flipped');
    }
    isFlipped = false;
    
    // Update buttons
    const correctBtn = document.getElementById('correctBtn');
    const incorrectBtn = document.getElementById('incorrectBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (correctBtn) correctBtn.style.display = 'none';
    if (incorrectBtn) incorrectBtn.style.display = 'none';
    if (nextBtn) nextBtn.textContent = '🔄 Flip Card';
    
    updateSessionStats();
}

function flipCard() {
    if (currentCardIndex < flashcards.length) {
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.toggle('flipped');
            isFlipped = !isFlipped;
            
            if (isFlipped) {
                const correctBtn = document.getElementById('correctBtn');
                const incorrectBtn = document.getElementById('incorrectBtn');
                const nextBtn = document.getElementById('nextBtn');
                
                if (correctBtn) correctBtn.style.display = 'inline-block';
                if (incorrectBtn) incorrectBtn.style.display = 'inline-block';
                if (nextBtn) nextBtn.style.display = 'none';
            }
        }
    }
}

function markAnswer(isCorrect) {
    sessionStats.total++;
    sessionStats.answers.push({
        cardId: flashcards[currentCardIndex].id,
        correct: isCorrect,
        timestamp: new Date().toISOString(),
        difficulty: flashcards[currentCardIndex].difficulty
    });
    
    if (isCorrect) {
        sessionStats.correct++;
    }
    
    currentCardIndex++;
    updateCard();
    
    // Safely hide buttons
    const correctBtn = document.getElementById('correctBtn');
    const incorrectBtn = document.getElementById('incorrectBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (correctBtn) correctBtn.style.display = 'none';
    if (incorrectBtn) incorrectBtn.style.display = 'none';
    if (nextBtn) {
        nextBtn.style.display = 'inline-block';
        nextBtn.textContent = currentCardIndex >= flashcards.length ? '🏁 Finish' : '▶️ Next Card';
    }
}

function nextCard() {
    if (currentCardIndex === 0 && sessionStats.total === 0) {
        // Starting the session
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) nextBtn.textContent = '🔄 Flip Card';
        updateCard();
    } else if (isFlipped) {
        // Show marking buttons if card is flipped but not answered
        return;
    } else if (currentCardIndex < flashcards.length) {
        flipCard();
    } else {
        completeSession();
    }
}

function completeSession() {
    const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total * 100).toFixed(1) : 0;
    const passed = accuracy >= settings.passingThreshold;
    
    // Save session to progress
    const sessionData = {
        date: new Date().toISOString(),
        accuracy: parseFloat(accuracy),
        correct: sessionStats.correct,
        total: sessionStats.total,
        passed: passed,
        type: 'flashcard',
        topic: document.getElementById('currentTopic').textContent.split('\n')[0]
    };
    
    progressData.push(sessionData);
    localStorage.setItem('flashcardProgress', JSON.stringify(progressData));
    
    // Show completion message
    const sessionComplete = document.getElementById('sessionComplete');
    const finalResults = document.getElementById('finalResults');
    
    if (sessionComplete) sessionComplete.style.display = 'block';
    if (finalResults) {
        finalResults.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card" style="background: ${passed ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'}; border-color: ${passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}">
                    <div class="stat-number" style="color: white;">${accuracy}%</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.9);">Final Accuracy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${sessionStats.correct}/${sessionStats.total}</div>
                    <div class="stat-label">Correct Answers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${passed ? '✅' : '❌'}</div>
                    <div class="stat-label">${passed ? 'Passed!' : 'Keep Studying!'}</div>
                </div>
            </div>
        `;
    }
    
    updateProgressChart();
    updateProgressStats();
}

function restartSession() {
    if (settings.shuffleCards) {
        shuffleArray(flashcards);
    }
    resetSession();
}

function updateSessionStats() {
    const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total * 100).toFixed(1) : 0;
    const progress = flashcards.length > 0 ? (currentCardIndex / flashcards.length * 100).toFixed(1) : 0;
    
    const currentCard = document.getElementById('currentCard');
    const totalCards = document.getElementById('totalCards');
    const correctCount = document.getElementById('correctCount');
    const currentAccuracy = document.getElementById('currentAccuracy');
    const progressFill = document.getElementById('progressFill');
    
    if (currentCard) currentCard.textContent = Math.min(currentCardIndex + 1, flashcards.length);
    if (totalCards) totalCards.textContent = flashcards.length;
    if (correctCount) correctCount.textContent = sessionStats.correct;
    if (currentAccuracy) currentAccuracy.textContent = accuracy + '%';
    
    if (progressFill) {
        progressFill.style.width = progress + '%';
        progressFill.textContent = progress + '%';
    }
}

// ==========================================================================
// Quiz Mode
// ==========================================================================

function setQuizMode(mode, event = null) {
    quizMode = mode;
    document.querySelectorAll('#quiz .mode-btn').forEach(btn => btn.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Find the correct button based on mode
        document.querySelectorAll('#quiz .mode-btn').forEach(btn => {
            const btnText = btn.textContent.toLowerCase();
            if ((mode === 'single' && btnText.includes('single')) ||
                (mode === 'multiple' && btnText.includes('multiple')) ||
                (mode === 'timed' && btnText.includes('timed'))) {
                btn.classList.add('active');
            }
        });
    }
    
    const quizTimerElement = document.getElementById('quizTimer');
    const timedQuizStart = document.getElementById('timedQuizStart');
    const quizContainer = document.querySelector('.quiz-container:not(#timedQuizStart)');
    
    // Clear any running timer when switching modes
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
        timerStarted = false;
    }
    
    if (mode === 'timed') {
        // Show timed quiz start screen, hide regular quiz
        if (quizTimerElement) quizTimerElement.style.display = 'none';
        if (timedQuizStart) {
            timedQuizStart.style.display = 'block';
            const durationSpan = document.getElementById('timedQuizDuration');
            if (durationSpan) durationSpan.textContent = settings.quizTimeLimit || 60;
        }
        if (quizContainer) quizContainer.style.display = 'none';
        
        // Reset timer display
        const timeLeftElement = document.getElementById('timeLeft');
        const timerProgressFill = document.getElementById('timerProgressFill');
        
        if (timeLeftElement) {
            timeLeftElement.textContent = settings.quizTimeLimit || 60;
        }
        if (timerProgressFill) {
            timerProgressFill.style.width = '100%';
            timerProgressFill.style.background = 'linear-gradient(90deg, #10B981 0%, #FFD700 100%)';
        }
    } else {
        // Show regular quiz, hide timed quiz elements
        if (quizTimerElement) quizTimerElement.style.display = 'none';
        if (timedQuizStart) timedQuizStart.style.display = 'none';
        if (quizContainer) quizContainer.style.display = 'block';
    }
    
    // Reset quiz state when changing modes
    quizCompleted = false;
    
    // Only reset quiz if we have flashcards loaded
    if (flashcards.length > 0) {
        resetQuiz();
    }
}

function resetQuiz() {
    // Clear any running timer first
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }
    
    currentCardIndex = 0;
    selectedAnswers = [];
    timerStarted = false;
    quizCompleted = false;
    timeLeft = parseInt(settings.quizTimeLimit) || 60;
    
    quizStats = {
        correct: 0,
        total: 0,
        answers: [],
        startTime: null,
        endTime: null
    };
    
    const hasQuizChoices = flashcards.some(card => card && card.choices && card.correctChoices);
    
    const quizContent = document.getElementById('quizContent');
    const noQuizMessage = document.getElementById('noQuizMessage');
    const quizComplete = document.getElementById('quizComplete');
    const timedQuizStart = document.getElementById('timedQuizStart');
    const quizContainer = document.querySelector('.quiz-container:not(#timedQuizStart)');
    
    if (hasQuizChoices && flashcards.length > 0) {
        if (quizContent) quizContent.style.display = 'block';
        if (noQuizMessage) noQuizMessage.style.display = 'none';
    } else {
        if (quizContent) quizContent.style.display = 'none';
        if (noQuizMessage) noQuizMessage.style.display = 'block';
    }
    
    if (quizComplete) quizComplete.style.display = 'none';
    
    // Show appropriate interface based on quiz mode
    if (quizMode === 'timed') {
        if (timedQuizStart) {
            timedQuizStart.style.display = 'block';
            const durationSpan = document.getElementById('timedQuizDuration');
            if (durationSpan) durationSpan.textContent = settings.quizTimeLimit || 60;
        }
        if (quizContainer) quizContainer.style.display = 'none';
        
        // Reset timer display
        const timeLeftElement = document.getElementById('timeLeft');
        const timerProgressFill = document.getElementById('timerProgressFill');
        const quizTimerElement = document.getElementById('quizTimer');
        
        if (timeLeftElement) timeLeftElement.textContent = settings.quizTimeLimit || 60;
        if (timerProgressFill) {
            timerProgressFill.style.width = '100%';
            timerProgressFill.style.background = 'linear-gradient(90deg, #10B981 0%, #FFD700 100%)';
        }
        if (quizTimerElement) quizTimerElement.style.display = 'none';
    } else {
        if (timedQuizStart) timedQuizStart.style.display = 'none';
        if (quizContainer) quizContainer.style.display = 'block';
        updateQuizQuestion();
    }
    
    updateQuizStats();
    
    // Only update quiz question for non-timed modes
    if (quizMode !== 'timed') {
        updateQuizQuestion();
    }
}

function updateQuizQuestion() {
    // Don't proceed if quiz is completed or time is up
    if (quizCompleted || timeLeft <= 0) {
        return;
    }
    
    if (currentCardIndex >= flashcards.length) {
        completeQuiz();
        return;
    }
    
    const card = flashcards[currentCardIndex];
    
    if (!card || !card.choices || !card.correctChoices) {
        // Skip cards without quiz data
        console.log('Skipping card without quiz data:', card?.id || 'unknown');
        currentCardIndex++;
        updateQuizQuestion();
        return;
    }
    
    const quizQuestion = document.getElementById('quizQuestion');
    if (quizQuestion) {
        quizQuestion.textContent = `Question ${currentCardIndex + 1}: ${card.question}`;
    }
    
    const optionsContainer = document.getElementById('quizOptions');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        selectedAnswers = [];
        
        card.choices.forEach((choice, index) => {
            const option = document.createElement('div');
            option.className = 'quiz-option';
            option.textContent = choice;
            option.setAttribute('data-index', index);
            option.style.pointerEvents = 'auto'; // Ensure it's clickable
            option.style.opacity = '1'; // Reset opacity
            
            // Add click event listener (CSP-compliant)
            option.addEventListener('click', function() {
                // Don't allow selection if time is up
                if (!quizCompleted && timeLeft > 0) {
                    selectQuizOption(index, this);
                }
            });
            
            optionsContainer.appendChild(option);
        });
    }
    
    const submitBtn = document.getElementById('quizSubmitBtn');
    const nextBtn = document.getElementById('quizNextBtn');
    
    if (submitBtn) submitBtn.style.display = 'inline-block';
    if (nextBtn) nextBtn.textContent = '▶️ Next Question';
    
    updateQuizStats();
    
    // Show current question number and remaining time
    console.log(`Question ${currentCardIndex + 1}/${flashcards.length}, ${timeLeft}s remaining`);
    
    // NOTE: Timer continues running from startEntireQuizTimer() - do NOT restart it here!
}

function selectQuizOption(index, element) {
    // Safety check
    if (!element || currentCardIndex >= flashcards.length) {
        return;
    }
    
    // Check if already disabled (answered)
    if (element.style.pointerEvents === 'none') {
        return;
    }
    
    if (quizMode === 'single') {
        // Single choice - clear other selections
        document.querySelectorAll('.quiz-option').forEach(opt => {
            if (opt.classList) {
                opt.classList.remove('selected');
            }
        });
        selectedAnswers = [index];
        if (element.classList) {
            element.classList.add('selected');
        }
    } else {
        // Multiple choice - toggle selection
        if (selectedAnswers.includes(index)) {
            selectedAnswers = selectedAnswers.filter(i => i !== index);
            if (element.classList) {
                element.classList.remove('selected');
            }
        } else {
            selectedAnswers.push(index);
            if (element.classList) {
                element.classList.add('selected');
            }
        }
    }
    
    console.log('Selected answers:', selectedAnswers); // Debug log
}

function submitQuizAnswer() {
    const card = flashcards[currentCardIndex];
    
    // Safety check to ensure card exists and has quiz data
    if (!card || !card.correctChoices) {
        console.error('Card missing quiz data:', card);
        nextQuizQuestion();
        return;
    }
    
    // Don't allow submission if time is up
    if (quizCompleted || timeLeft <= 0) {
        return;
    }
    
    const correctAnswers = card.correctChoices;
    
    // Check if answer is correct
    const isCorrect = selectedAnswers.length === correctAnswers.length && 
                    selectedAnswers.every(ans => correctAnswers.includes(ans));
    
    // Show immediate feedback toaster
    if (isCorrect) {
        showMessage('✅ Correct! Well done!', 'success');
    } else {
        showMessage('❌ Incorrect. The correct answer is highlighted.', 'error');
    }
    
    // Show correct/incorrect feedback on options
    document.querySelectorAll('.quiz-option').forEach((opt, index) => {
        if (opt && opt.classList) {
            if (correctAnswers.includes(index)) {
                opt.classList.add('correct');
            } else if (selectedAnswers.includes(index)) {
                opt.classList.add('incorrect');
            }
            // Disable further clicking
            opt.style.pointerEvents = 'none';
        }
    });
    
    quizStats.total++;
    quizStats.answers.push({
        cardId: card.id,
        correct: isCorrect,
        selectedAnswers: [...selectedAnswers],
        correctAnswers: [...correctAnswers],
        timestamp: new Date().toISOString(),
        difficulty: card.difficulty
    });
    
    if (isCorrect) {
        quizStats.correct++;
    }
    
    const submitBtn = document.getElementById('quizSubmitBtn');
    if (submitBtn) submitBtn.style.display = 'none';
    
    // Move to next question after delay (timer continues running)
    setTimeout(() => {
        currentCardIndex++;
        
        // Check if quiz should end (either all questions done OR time up)
        if (currentCardIndex >= flashcards.length || quizCompleted) {
            completeQuiz();
        } else {
            updateQuizQuestion(); // Load next question, timer keeps running
        }
    }, 1500); // Shorter delay to maximize quiz time usage
}

function nextQuizQuestion() {
    if (currentCardIndex === 0 && quizStats.total === 0) {
        // Starting the quiz (for non-timed modes)
        if (quizMode !== 'timed') {
            quizStats.startTime = new Date().toISOString();
        }
        updateQuizQuestion();
    } else if (currentCardIndex < flashcards.length) {
        currentCardIndex++;
        updateQuizQuestion();
    } else {
        completeQuiz();
    }
}

function startTimedQuiz() {
    // Hide start screen and show quiz
    const timedQuizStart = document.getElementById('timedQuizStart');
    const quizContainer = document.querySelector('.quiz-container:not(#timedQuizStart)');
    const quizTimerElement = document.getElementById('quizTimer');
    
    if (timedQuizStart) timedQuizStart.style.display = 'none';
    if (quizContainer) quizContainer.style.display = 'block';
    if (quizTimerElement) quizTimerElement.style.display = 'block';
    
    // Reset quiz state
    quizCompleted = false;
    currentCardIndex = 0;
    selectedAnswers = [];
    quizStats = {
        correct: 0,
        total: 0,
        answers: [],
        startTime: new Date().toISOString(),
        endTime: null
    };
    
    // Start the quiz and timer for ENTIRE quiz duration
    updateQuizQuestion();
    startEntireQuizTimer();
}

function startEntireQuizTimer() {
    // Clear any existing timer first
    if (quizTimer) {
        clearInterval(quizTimer);
    }
    
    // Get the current time limit from settings - this is for the ENTIRE quiz
    timeLeft = parseInt(settings.quizTimeLimit) || 60;
    const totalTime = timeLeft;
    timerStarted = true;
    
    const timeLeftElement = document.getElementById('timeLeft');
    const timerProgressFill = document.getElementById('timerProgressFill');
    
    // Initial display - start at full
    if (timeLeftElement) {
        timeLeftElement.textContent = timeLeft;
    }
    if (timerProgressFill) {
        timerProgressFill.style.width = '100%'; // Start full
        timerProgressFill.style.background = 'linear-gradient(90deg, #10B981 0%, #FFD700 100%)';
    }
    
    console.log('Starting ENTIRE QUIZ timer with', timeLeft, 'seconds total'); // Debug log
    
    quizTimer = setInterval(() => {
        timeLeft--;
        
        // Update time display
        if (timeLeftElement) {
            timeLeftElement.textContent = Math.max(0, timeLeft);
        }
        
        // Update progress bar - EMPTIES as time runs out
        if (timerProgressFill) {
            const percentage = Math.max(0, (timeLeft / totalTime) * 100);
            timerProgressFill.style.width = percentage + '%'; // Gets smaller over time
            
            // Change color and glow as time runs out
            if (percentage > 60) {
                timerProgressFill.style.background = 'linear-gradient(90deg, #10B981 0%, #34D399 100%)';
                timerProgressFill.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.4)';
            } else if (percentage > 30) {
                timerProgressFill.style.background = 'linear-gradient(90deg, #FFD700 0%, #FbbF24 100%)';
                timerProgressFill.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.4)';
            } else {
                timerProgressFill.style.background = 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)';
                timerProgressFill.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.6)';
                
                // Add pulsing effect when time is critically low
                if (percentage < 10) {
                    timerProgressFill.style.animation = 'pulse 0.5s ease-in-out infinite alternate';
                }
            }
        }
        
        console.log('ENTIRE QUIZ Timer:', timeLeft, 'seconds remaining,', Math.round((timeLeft / totalTime) * 100) + '% left'); // Debug log
        
        // Complete quiz when time runs out (only once)
        if (timeLeft <= 0 && !quizCompleted) {
            clearInterval(quizTimer);
            quizTimer = null;
            timerStarted = false;
            quizCompleted = true;
            
            // Disable all quiz interactions
            document.querySelectorAll('.quiz-option').forEach(opt => {
                opt.style.pointerEvents = 'none';
                opt.style.opacity = '0.5';
            });
            
            const submitBtn = document.getElementById('quizSubmitBtn');
            if (submitBtn) submitBtn.style.display = 'none';
            
            showMessage('⏰ Time\'s up! Quiz completed automatically.', 'error');
            setTimeout(() => {
                completeQuiz();
            }, 1000); // Small delay to show the message
        }
    }, 1000);
}

function showConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Create confetti pieces
    for (let i = 0; i < 20; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.animationDuration = Math.random() * 3 + 2 + 's';
        piece.style.animationDelay = Math.random() * 2 + 's';
        confetti.appendChild(piece);
    }
    
    document.body.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
        if (document.body.contains(confetti)) {
            document.body.removeChild(confetti);
        }
    }, 6000);
}

function completeQuiz() {
    // Prevent multiple completions
    if (quizCompleted) {
        console.log('Quiz already completed, ignoring duplicate call');
        return;
    }
    
    quizCompleted = true;
    
    // Clear timer if running
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
        timerStarted = false;
        console.log('Timer cleared on quiz completion'); // Debug log
    }
    
    quizStats.endTime = new Date().toISOString();
    const accuracy = quizStats.total > 0 ? (quizStats.correct / quizStats.total * 100).toFixed(1) : 0;
    const passed = parseFloat(accuracy) >= settings.passingThreshold;
    
    // Calculate if quiz ended due to time or completion
    const timeRanOut = timeLeft <= 0;
    const questionsCompleted = currentCardIndex >= flashcards.length;
    
    console.log(`Quiz completed: ${quizStats.correct}/${quizStats.total} = ${accuracy}%, passing threshold: ${settings.passingThreshold}%, passed: ${passed}, time ran out: ${timeRanOut}, questions completed: ${questionsCompleted}`); // Debug log
    
    // Show appropriate completion message
    if (passed) {
        showConfetti();
        if (timeRanOut) {
            showMessage('🎉 Time\'s up, but you passed! Great job under pressure!', 'success');
        } else {
            showMessage('🎉 Congratulations! You passed the quiz!', 'success');
        }
    } else {
        if (timeRanOut) {
            showMessage(`⏰ Time's up! You scored ${accuracy}%. Need ${settings.passingThreshold}% to pass.`, 'error');
        } else {
            showMessage(`📚 You scored ${accuracy}%. Keep practicing to reach ${settings.passingThreshold}%!`, 'error');
        }
    }
    
    // Disable all remaining quiz interactions
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
        opt.style.opacity = '0.6';
    });
    
    const submitBtn = document.getElementById('quizSubmitBtn');
    if (submitBtn) submitBtn.style.display = 'none';
    
    // Save quiz to progress
    const quizData = {
        date: new Date().toISOString(),
        accuracy: parseFloat(accuracy),
        correct: quizStats.correct,
        total: quizStats.total,
        passed: passed,
        type: 'quiz',
        mode: quizMode,
        topic: document.getElementById('currentTopic').textContent.split('\n')[0],
        duration: quizStats.startTime ? Math.round((new Date(quizStats.endTime) - new Date(quizStats.startTime)) / 1000) : 0,
        completedAllQuestions: questionsCompleted,
        timeRanOut: timeRanOut
    };
    
    progressData.push(quizData);
    localStorage.setItem('flashcardProgress', JSON.stringify(progressData));
    
    // Show completion message
    const quizComplete = document.getElementById('quizComplete');
    const quizFinalResults = document.getElementById('quizFinalResults');
    
    if (quizComplete) quizComplete.style.display = 'block';
    if (quizFinalResults) {
        const completionStatus = questionsCompleted ? 
            `All ${quizStats.total} questions completed` : 
            `${quizStats.total} of ${flashcards.length} questions answered`;
            
        quizFinalResults.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card" style="background: ${passed ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'}; border-color: ${passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}">
                    <div class="stat-number" style="color: white;">${accuracy}%</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.9);">Final Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${quizStats.correct}/${quizStats.total}</div>
                    <div class="stat-label">Correct Answers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${quizData.duration}s</div>
                    <div class="stat-label">Time Used</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${passed ? '🎉' : '📚'}</div>
                    <div class="stat-label">${passed ? 'Passed!' : 'Keep Learning!'}</div>
                </div>
            </div>
            <p style="text-align: center; margin-top: 16px; color: rgba(228, 228, 231, 0.7);">
                ${completionStatus}${timeRanOut ? ' • Time limit reached' : ''}
            </p>
        `;
    }
    
    updateProgressChart();
    updateProgressStats();
}

function restartQuiz() {
    if (settings.shuffleCards) {
        shuffleArray(flashcards);
    }
    resetQuiz();
}

function updateQuizStats() {
    const accuracy = quizStats.total > 0 ? (quizStats.correct / quizStats.total * 100).toFixed(1) : 0;
    
    // Count total quiz-eligible cards
    const totalQuizCards = flashcards.filter(card => card && card.choices && card.correctChoices).length;
    const progress = totalQuizCards > 0 ? (quizStats.total / totalQuizCards * 100).toFixed(1) : 0;
    
    const quizCurrentCard = document.getElementById('quizCurrentCard');
    const quizTotalCards = document.getElementById('quizTotalCards');
    const quizCorrectCount = document.getElementById('quizCorrectCount');
    const quizCurrentAccuracy = document.getElementById('quizCurrentAccuracy');
    const quizProgressFill = document.getElementById('quizProgressFill');
    
    if (quizCurrentCard) quizCurrentCard.textContent = quizStats.total + 1;
    if (quizTotalCards) quizTotalCards.textContent = totalQuizCards;
    if (quizCorrectCount) quizCorrectCount.textContent = quizStats.correct;
    if (quizCurrentAccuracy) quizCurrentAccuracy.textContent = accuracy + '%';
    
    if (quizProgressFill) {
        quizProgressFill.style.width = progress + '%';
        quizProgressFill.textContent = progress + '%';
    }
}

function downloadQuizResults() {
    const results = {
        topic: document.getElementById('currentTopic').textContent.split('\n')[0],
        date: new Date().toISOString(),
        mode: quizMode,
        score: `${quizStats.correct}/${quizStats.total}`,
        accuracy: `${(quizStats.correct / quizStats.total * 100).toFixed(1)}%`,
        passed: (quizStats.correct / quizStats.total * 100) >= settings.passingThreshold,
        duration: quizStats.endTime ? Math.round((new Date(quizStats.endTime) - new Date(quizStats.startTime)) / 1000) : 0,
        answers: quizStats.answers.map(ans => ({
            question: flashcards.find(card => card.id === ans.cardId)?.question || 'Unknown',
            correct: ans.correct,
            difficulty: ans.difficulty,
            selectedAnswers: ans.selectedAnswers,
            correctAnswers: ans.correctAnswers
        }))
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Quiz results downloaded successfully!', 'success');
}

// ==========================================================================
// Progress and Analytics
// ==========================================================================

function updateProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Destroy existing chart if it exists and has destroy method
    if (window.progressChart && typeof window.progressChart.destroy === 'function') {
        window.progressChart.destroy();
    }
    
    const labels = progressData.slice(-10).map((session, index) => 
        `${session.type === 'quiz' ? 'Q' : 'F'}${progressData.length - 9 + index}`);
    const accuracyData = progressData.slice(-10).map(session => session.accuracy);
    const passingLine = new Array(labels.length).fill(settings.passingThreshold);
    
    window.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Accuracy %',
                data: accuracyData,
                borderColor: '#00F5FF',
                backgroundColor: 'rgba(0, 245, 255, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#00F5FF',
                pointBorderColor: '#FFD700',
                pointBorderWidth: 2,
                pointRadius: 6
            }, {
                label: 'Passing Threshold',
                data: passingLine,
                borderColor: '#EF4444',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#E4E4E7'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#E4E4E7',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(228, 228, 231, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#E4E4E7'
                    },
                    grid: {
                        color: 'rgba(228, 228, 231, 0.1)'
                    }
                }
            }
        }
    });
}

function updateProgressStats() {
    const flashcardSessions = progressData.filter(session => session.type === 'flashcard');
    const quizSessions = progressData.filter(session => session.type === 'quiz');
    
    const totalAnswered = progressData.reduce((sum, session) => sum + session.total, 0);
    const totalCorrect = progressData.reduce((sum, session) => sum + session.correct, 0);
    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered * 100).toFixed(1) : 0;
    const passingSessions = progressData.filter(session => session.passed).length;
    
    const totalSessions = document.getElementById('totalSessions');
    const totalQuizzes = document.getElementById('totalQuizzes');
    const overallAccuracyElement = document.getElementById('overallAccuracy');
    const passingSessionsElement = document.getElementById('passingSessions');
    
    if (totalSessions) totalSessions.textContent = flashcardSessions.length;
    if (totalQuizzes) totalQuizzes.textContent = quizSessions.length;
    if (overallAccuracyElement) overallAccuracyElement.textContent = overallAccuracy + '%';
    if (passingSessionsElement) passingSessionsElement.textContent = passingSessions;
}

function exportProgress() {
    const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        totalSessions: progressData.length,
        progressData: progressData,
        settings: settings
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashmaster-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Progress data exported successfully!', 'success');
}

function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (importData.progressData && Array.isArray(importData.progressData)) {
                const mergeChoice = confirm(
                    `Import ${importData.progressData.length} sessions?\n\n` +
                    `OK = Merge with existing data\n` +
                    `Cancel = Replace all existing data`
                );
                
                if (mergeChoice) {
                    // Merge data
                    progressData = [...progressData, ...importData.progressData];
                } else {
                    // Replace data
                    progressData = importData.progressData;
                }
                
                // Import settings if available
                if (importData.settings) {
                    settings = { ...settings, ...importData.settings };
                    localStorage.setItem('flashcardSettings', JSON.stringify(settings));
                    loadSettings();
                }
                
                localStorage.setItem('flashcardProgress', JSON.stringify(progressData));
                updateProgressChart();
                updateProgressStats();
                
                showMessage(`Successfully imported ${importData.progressData.length} sessions!`, 'success');
            } else {
                throw new Error('Invalid progress file format');
            }
        } catch (error) {
            showMessage('Error importing progress: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function clearProgress() {
    if (confirm('Are you sure you want to clear all progress data? This action cannot be undone.')) {
        progressData = [];
        localStorage.removeItem('flashcardProgress');
        updateProgressChart();
        updateProgressStats();
        showMessage('All progress data cleared successfully!', 'success');
    }
}

// ==========================================================================
// Settings
// ==========================================================================

function loadSettings() {
    const passingThreshold = document.getElementById('passingThreshold');
    const shuffleCards = document.getElementById('shuffleCards');
    const quizTimeLimit = document.getElementById('quizTimeLimit');
    
    if (passingThreshold) passingThreshold.value = settings.passingThreshold;
    if (shuffleCards) shuffleCards.value = settings.shuffleCards.toString();
    if (quizTimeLimit) quizTimeLimit.value = settings.quizTimeLimit || 60;
}

function saveSettings() {
    const passingThreshold = document.getElementById('passingThreshold');
    const shuffleCards = document.getElementById('shuffleCards');
    const quizTimeLimit = document.getElementById('quizTimeLimit');
    
    settings.passingThreshold = parseInt(passingThreshold.value);
    settings.shuffleCards = shuffleCards.value === 'true';
    settings.quizTimeLimit = parseInt(quizTimeLimit.value) || 60;
    
    localStorage.setItem('flashcardSettings', JSON.stringify(settings));
    showMessage('Configuration saved successfully!', 'success');
    
    // Update timer display if in quiz mode and timed mode
    if (quizMode === 'timed') {
        const timeLeftElement = document.getElementById('timeLeft');
        if (timeLeftElement && !quizTimer) { // Only update if timer isn't running
            timeLeftElement.textContent = settings.quizTimeLimit;
        }
    }
    
    // Update progress chart if threshold changed
    updateProgressChart();
}
