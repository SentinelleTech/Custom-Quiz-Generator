// Global variables
let quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let timer = null;
let timeRemaining = 0;
let userAnswers = [];
let editingQuestionIndex = -1;

// DOM elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const questionsListElement = document.getElementById('questions-list');
const addQuestionBtn = document.getElementById('add-question-btn');
const saveQuizBtn = document.getElementById('save-quiz-btn');
const questionModal = document.getElementById('question-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const addOptionBtn = document.getElementById('add-option-btn');
const saveQuestionBtn = document.getElementById('save-question-btn');
const cancelQuestionBtn = document.getElementById('cancel-question-btn');
const quizSelect = document.getElementById('quiz-select');
const quizContainer = document.getElementById('quiz-container');
const quizTitleDisplay = document.getElementById('quiz-title-display');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const questionDisplay = document.getElementById('question-display');
const optionsDisplay = document.getElementById('options-display');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const resultsContainer = document.getElementById('results-container');
const scoreElement = document.getElementById('score');
const totalQuestionsElement = document.getElementById('total-questions');
const timeTakenElement = document.getElementById('time-taken');
const performanceMessage = document.getElementById('performance-message');
const shareLink = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const savedQuizzesList = document.getElementById('saved-quizzes-list');
const noQuizzesMessage = document.getElementById('no-quizzes-message');

// Initialize
function init() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
            
            if (tabId === 'my-quizzes') {
                loadSavedQuizzes();
            } else if (tabId === 'play') {
                loadQuizzesIntoSelect();
            }
        });
    });

    // Question modal events
    addQuestionBtn.addEventListener('click', openAddQuestionModal);
    closeModalBtn.addEventListener('click', closeQuestionModal);
    addOptionBtn.addEventListener('click', addOptionField);
    saveQuestionBtn.addEventListener('click', saveQuestion);
    cancelQuestionBtn.addEventListener('click', closeQuestionModal);
    
    // Save quiz
    saveQuizBtn.addEventListener('click', saveQuiz);
    
    // Quiz playing events
    quizSelect.addEventListener('change', selectQuiz);
    prevBtn.addEventListener('click', showPreviousQuestion);
    nextBtn.addEventListener('click', showNextQuestion);
    
    // Results events
    copyLinkBtn.addEventListener('click', copyShareLink);
    playAgainBtn.addEventListener('click', resetQuiz);
    
    // Initial quiz list population
    loadQuizzesIntoSelect();
    
    // Event delegation for dynamically created elements
    document.addEventListener('click', function(event) {
        // Edit question
        if (event.target.classList.contains('edit-btn')) {
            const questionIndex = parseInt(event.target.getAttribute('data-index'));
            openEditQuestionModal(questionIndex);
        }
        
        // Delete question
        if (event.target.classList.contains('delete-btn')) {
            const questionIndex = parseInt(event.target.getAttribute('data-index'));
            deleteQuestion(questionIndex);
        }
        
        // Remove option
        if (event.target.classList.contains('remove-option-btn')) {
            const optionGroup = event.target.closest('.option-group');
            if (optionsContainer.children.length > 2) {
                optionGroup.remove();
            } else {
                alert('A question must have at least 2 options');
            }
        }
        
        // Select option during quiz
        if (event.target.classList.contains('option')) {
            selectOption(event.target);
        }
        
        // Delete quiz
        if (event.target.classList.contains('delete-quiz-btn')) {
            const quizIndex = parseInt(event.target.getAttribute('data-index'));
            deleteQuiz(quizIndex);
        }
        
        // Play quiz
        if (event.target.classList.contains('play-quiz-btn')) {
            const quizIndex = parseInt(event.target.getAttribute('data-index'));
            switchTab('play');
            quizSelect.value = quizIndex;
            selectQuiz();
        }
    });
    
    // Close modal when clicking outside
    questionModal.addEventListener('click', function(event) {
        if (event.target === questionModal) {
            closeQuestionModal();
        }
    });
}

// Switch tabs
function switchTab(tabId) {
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    tabContents.forEach(content => {
        if (content.id === tabId + '-tab') {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Open add question modal
function openAddQuestionModal() {
    modalTitle.textContent = 'Add Question';
    questionText.value = '';
    
    // Reset options
    optionsContainer.innerHTML = '';
    
    // Add default two options
    for (let i = 0; i < 2; i++) {
        addOptionField();
    }
    
    // First option is correct by default
    optionsContainer.querySelector('.correct-checkbox').checked = true;
    
    editingQuestionIndex = -1;
    questionModal.style.display = 'flex';
}

// Open edit question modal
function openEditQuestionModal(questionIndex) {
    const questions = getCurrentQuestions();
    const question = questions[questionIndex];
    
    modalTitle.textContent = 'Edit Question';
    questionText.value = question.text;
    
    // Reset options
    optionsContainer.innerHTML = '';
    
    // Add options
    question.options.forEach((option, index) => {
        addOptionField();
        const optionGroup = optionsContainer.lastChild;
        optionGroup.querySelector('.option-text').value = option.text;
        optionGroup.querySelector('.correct-checkbox').checked = option.correct;
    });
    
    editingQuestionIndex = questionIndex;
    questionModal.style.display = 'flex';
}

// Close question modal
function closeQuestionModal() {
    questionModal.style.display = 'none';
}

// Add option field
function addOptionField() {
    const optionGroup = document.createElement('div');
    optionGroup.className = 'option-group';
    
    const optionIndex = optionsContainer.children.length + 1;
    
    optionGroup.innerHTML = `
        <div class="option-input">
            <input type="text" placeholder="Option ${optionIndex}" class="option-text">
        </div>
        <input type="radio" name="correct-option" class="correct-checkbox">
        <div class="option-actions">
            <button class="remove-option-btn">Remove</button>
        </div>
    `;
    
    optionsContainer.appendChild(optionGroup);
}

// Save question
function saveQuestion() {
    const questionValue = questionText.value.trim();
    if (!questionValue) {
        alert('Please enter a question');
        return;
    }
    
    const options = [];
    let hasCorrectOption = false;
    
    // Collect options
    optionsContainer.querySelectorAll('.option-group').forEach(group => {
        const optionText = group.querySelector('.option-text').value.trim();
        const isCorrect = group.querySelector('.correct-checkbox').checked;
        
        if (!optionText) {
            alert('Please fill in all options');
            return;
        }
        
        options.push({
            text: optionText,
            correct: isCorrect
        });
        
        if (isCorrect) {
            hasCorrectOption = true;
        }
    });
    
    if (options.length < 2) {
        alert('Please add at least 2 options');
        return;
    }
    
    if (!hasCorrectOption) {
        alert('Please select a correct option');
        return;
    }
    
    const question = {
        text: questionValue,
        options: options
    };
    
    // Add or update question
    const questions = getCurrentQuestions();
    
    if (editingQuestionIndex >= 0) {
        questions[editingQuestionIndex] = question;
    } else {
        questions.push(question);
    }
    
    // Update questions list UI
    updateQuestionsList(questions);
    
    // Close modal
    closeQuestionModal();
}

// Delete question
function deleteQuestion(index) {
    if (confirm('Are you sure you want to delete this question?')) {
        const questions = getCurrentQuestions();
        questions.splice(index, 1);
        updateQuestionsList(questions);
    }
}

// Get current questions from editor
function getCurrentQuestions() {
    // Get questions from temporary storage
    return JSON.parse(localStorage.getItem('temp_questions')) || [];
}

// Update questions list UI
function updateQuestionsList(questions) {
    // Save to temporary storage
    localStorage.setItem('temp_questions', JSON.stringify(questions));
    
    // Update UI
    questionsListElement.innerHTML = '';
    
    if (questions.length === 0) {
        questionsListElement.innerHTML = '<p>No questions added yet.</p>';
        return;
    }
    
    questions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        
        let optionsHtml = '';
        question.options.forEach(option => {
            const correctMark = option.correct ? ' ✓' : '';
            optionsHtml += `<li>${option.text}${correctMark}</li>`;
        });
        
        questionCard.innerHTML = `
            <h4>Q${index + 1}: ${question.text}</h4>
            <ul>${optionsHtml}</ul>
            <div class="question-actions">
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
        `;
        
        questionsListElement.appendChild(questionCard);
    });
}

// Save quiz
function saveQuiz() {
    const title = document.getElementById('quiz-title').value.trim();
    const description = document.getElementById('quiz-description').value.trim();
    const timeLimit = parseInt(document.getElementById('time-limit').value) || 30;
    const questions = getCurrentQuestions();
    
    if (!title) {
        alert('Please enter a quiz title');
        return;
    }
    
    if (questions.length === 0) {
        alert('Please add at least one question');
        return;
    }
    
    const quiz = {
        id: Date.now().toString(),
        title: title,
        description: description,
        timeLimit: timeLimit,
        questions: questions,
        dateCreated: new Date().toISOString()
    };
    
    // Add to quizzes list
    quizzes.push(quiz);
    saveQuizzes();
    
    // Clear form
    document.getElementById('quiz-title').value = '';
    document.getElementById('quiz-description').value = '';
    document.getElementById('time-limit').value = '30';
    localStorage.removeItem('temp_questions');
    updateQuestionsList([]);
    
    alert('Quiz saved successfully!');
    
    // Update quiz select options
    loadQuizzesIntoSelect();
}

// Save quizzes to localStorage
function saveQuizzes() {
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
}

// Load quizzes into select element
function loadQuizzesIntoSelect() {
    quizSelect.innerHTML = '<option value="">-- Select a quiz --</option>';
    
    quizzes.forEach((quiz, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = quiz.title;
        quizSelect.appendChild(option);
    });
}

// Select quiz to play
function selectQuiz() {
    const selectedIndex = quizSelect.value;
    
    if (selectedIndex === '') {
        quizContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        return;
    }
    
    currentQuiz = quizzes[selectedIndex];
    currentQuestionIndex = 0;
    userAnswers = [];
    
    // Initialize user answers array
    currentQuiz.questions.forEach(() => {
        userAnswers.push(null);
    });
    
    // Show quiz container
    quizContainer.style.display = 'block';
    resultsContainer.style.display = 'none';
    
    // Set quiz title
    quizTitleDisplay.textContent = currentQuiz.title;
    
    // Show first question
    showQuestion();
}

// Show current question
function showQuestion() {
    if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
        showResults();
        return;
    }
    
    const question = currentQuiz.questions[currentQuestionIndex];
    
    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    progressBar.style.width = progress + '%';
    
    // Show question
    questionDisplay.textContent = `Q${currentQuestionIndex + 1}: ${question.text}`;
    
    // Show options
    optionsDisplay.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option.text;
        optionElement.setAttribute('data-index', index);
        
        // Restore previous selection
        if (userAnswers[currentQuestionIndex] === index) {
            optionElement.classList.add('selected');
        }
        
        optionsDisplay.appendChild(optionElement);
    });
    
    // Update navigation buttons
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.textContent = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish' : 'Next';
    
    // Start timer
    startTimer();
}

// Start timer for current question
function startTimer() {
    clearInterval(timer);
    timeRemaining = currentQuiz.timeLimit;
    updateTimerDisplay();
    
    timer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timer);
            // Auto move to next question when time runs out
            setTimeout(() => {
                showNextQuestion();
            }, 1000);
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when time is running low
    if (timeRemaining <= 10) {
        timerDisplay.style.color = '#ef4444';
    } else {
        timerDisplay.style.color = '#1f2937';
    }
}

// Select option
function selectOption(optionElement) {
    // Remove previous selection
    optionsDisplay.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selection to clicked option
    optionElement.classList.add('selected');
    
    // Store answer
    const optionIndex = parseInt(optionElement.getAttribute('data-index'));
    userAnswers[currentQuestionIndex] = optionIndex;
}

// Show previous question
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        clearInterval(timer);
        currentQuestionIndex--;
        showQuestion();
    }
}

// Show next question
function showNextQuestion() {
    clearInterval(timer);
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        showResults();
    }
}

// Show quiz results
function showResults() {
    clearInterval(timer);
    quizContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    // Calculate score
    let correctAnswers = 0;
    let totalTime = 0;
    
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        if (userAnswer !== null && question.options[userAnswer] && question.options[userAnswer].correct) {
            correctAnswers++;
        }
        totalTime += currentQuiz.timeLimit;
    });
    
    // Display results
    scoreElement.textContent = correctAnswers;
    totalQuestionsElement.textContent = currentQuiz.questions.length;
    timeTakenElement.textContent = totalTime;
    
    // Performance message
    const percentage = (correctAnswers / currentQuiz.questions.length) * 100;
    let message = '';
    
    if (percentage >= 90) {
        message = 'Excellent! Outstanding performance! 🏆';
    } else if (percentage >= 80) {
        message = 'Great job! Well done! 👏';
    } else if (percentage >= 70) {
        message = 'Good work! Keep it up! 👍';
    } else if (percentage >= 60) {
        message = 'Not bad! Room for improvement. 📚';
    } else {
        message = 'Keep practicing! You\'ll get better! 💪';
    }
    
    performanceMessage.textContent = message;
    
    // Generate share link
    const results = {
        quiz: currentQuiz.title,
        score: correctAnswers,
        total: currentQuiz.questions.length,
        percentage: Math.round(percentage)
    };
    
    const shareText = `I just scored ${correctAnswers}/${currentQuiz.questions.length} (${Math.round(percentage)}%) on "${currentQuiz.title}" quiz!`;
    shareLink.value = shareText;
}

// Copy share link
function copyShareLink() {
    shareLink.select();
    shareLink.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    // Show feedback
    const originalText = copyLinkBtn.textContent;
    copyLinkBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyLinkBtn.textContent = originalText;
    }, 2000);
}

// Reset quiz
function resetQuiz() {
    if (currentQuiz) {
        currentQuestionIndex = 0;
        userAnswers = [];
        currentQuiz.questions.forEach(() => {
            userAnswers.push(null);
        });
        
        quizContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
        showQuestion();
    }
}

// Load saved quizzes
function loadSavedQuizzes() {
    if (quizzes.length === 0) {
        noQuizzesMessage.style.display = 'block';
        savedQuizzesList.innerHTML = '';
        savedQuizzesList.appendChild(noQuizzesMessage);
        return;
    }
    
    noQuizzesMessage.style.display = 'none';
    savedQuizzesList.innerHTML = '';
    
    quizzes.forEach((quiz, index) => {
        const quizCard = document.createElement('div');
        quizCard.className = 'question-card';
        
        const dateCreated = new Date(quiz.dateCreated).toLocaleDateString();
        
        quizCard.innerHTML = `
            <h4>${quiz.title}</h4>
            <p><strong>Description:</strong> ${quiz.description || 'No description'}</p>
            <p><strong>Questions:</strong> ${quiz.questions.length}</p>
            <p><strong>Time per question:</strong> ${quiz.timeLimit} seconds</p>
            <p><strong>Created:</strong> ${dateCreated}</p>
            <div class="question-actions">
                <button class="play-quiz-btn btn" data-index="${index}">Play Quiz</button>
                <button class="delete-quiz-btn btn" data-index="${index}" style="background-color: #ef4444;">Delete</button>
            </div>
        `;
        
        savedQuizzesList.appendChild(quizCard);
    });
}

// Delete quiz
function deleteQuiz(index) {
    if (confirm('Are you sure you want to delete this quiz?')) {
        quizzes.splice(index, 1);
        saveQuizzes();
        loadSavedQuizzes();
        loadQuizzesIntoSelect();
    }
}

// Initialize the application
init();

// Load saved quizzes on page load
loadSavedQuizzes();