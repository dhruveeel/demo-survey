// Global variables
let sessionId = null;
let currentPairIndex = 0;
let dependencyPairs = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Step navigation
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    const panel1 = document.getElementById('panel1');
    const panel2 = document.getElementById('panel2');
    const panel3 = document.getElementById('panel3');
    const panelComplete = document.getElementById('panel-complete');
    
    const nextToStep2Btn = document.getElementById('next-to-step2');
    const nextToStep3Btn = document.getElementById('next-to-step3');
    const backToStep1Btn = document.getElementById('back-to-step1');
    const backToStep2Btn = document.getElementById('back-to-step2');
    const finishBtn = document.getElementById('finish-button');
    const restartBtn = document.getElementById('restart-button');
    
    // Variable management
    const addVariableBtn = document.getElementById('add-variable');
    const variableList = document.getElementById('variable-list');
    
    // Dependency elements
    const dependencyQuestion = document.getElementById('dependency-question');
    const graphImage = document.getElementById('graph-image');
    const finalGraphImage = document.getElementById('final-graph-image');
    
    // Modal elements
    const errorModal = document.getElementById('error-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const errorMessage = document.getElementById('error-message');
    
    // Initialize delete variable buttons
    initDeleteVariableButtons();
    
    // Navigation event listeners
    nextToStep2Btn.addEventListener('click', function() {
        // Validate user information
        const name = document.getElementById('name').value.trim();
        const position = document.getElementById('position').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!name || !position || !email) {
            showError('Please fill in all fields.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return;
        }
        
        // Submit user information
        fetch('/submit_user_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, position, email }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sessionId = data.session_id;
                
                // Navigate to step 2
                step1.classList.add('completed');
                step2.classList.add('active');
                panel1.classList.remove('active');
                panel2.classList.add('active');
            } else {
                showError(data.error || 'An error occurred while submitting user information.');
            }
        })
        .catch(error => {
            showError('An error occurred while submitting user information.');
            console.error('Error:', error);
        });
    });
    
    nextToStep3Btn.addEventListener('click', function() {
        // Validate variables
        const variableInputs = document.querySelectorAll('.variable-input');
        const variables = [];
        
        for (const input of variableInputs) {
            const value = input.value.trim();
            if (value) {
                variables.push(value);
            }
        }
        
        if (variables.length < 2) {
            showError('Please enter at least 2 variables.');
            return;
        }
        
        // Check for duplicate variables
        const uniqueVariables = new Set(variables);
        if (uniqueVariables.size !== variables.length) {
            showError('Please ensure all variable names are unique.');
            return;
        }
        
        // Submit variables
        fetch('/submit_variables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_id: sessionId, variables }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Navigate to step 3
                step2.classList.add('completed');
                step3.classList.add('active');
                panel2.classList.remove('active');
                panel3.classList.add('active');
                
                // Load dependency pairs
                loadDependencyPairs();
            } else {
                showError(data.error || 'An error occurred while submitting variables.');
            }
        })
        .catch(error => {
            showError('An error occurred while submitting variables.');
            console.error('Error:', error);
        });
    });
    
    backToStep1Btn.addEventListener('click', function() {
        step2.classList.remove('active');
        panel2.classList.remove('active');
        panel1.classList.add('active');
    });
    
    backToStep2Btn.addEventListener('click', function() {
        step3.classList.remove('active');
        panel3.classList.remove('active');
        panel2.classList.add('active');
    });
    
    finishBtn.addEventListener('click', function() {
        // Save results
        fetch('/save_results?session_id=' + sessionId, {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Navigate to completion
                // Update final graph image
                fetch('/get_current_graph?session_id=' + sessionId)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        finalGraphImage.src = data.image;
                        
                        // Show completion panel
                        step3.classList.add('completed');
                        panel3.classList.remove('active');
                        panelComplete.classList.add('active');
                    }
                });
            } else {
                showError(data.error || 'An error occurred while saving results.');
            }
        })
        .catch(error => {
            showError('An error occurred while saving results.');
            console.error('Error:', error);
        });
    });
    
    restartBtn.addEventListener('click', function() {
        // Reset everything and go back to step 1
        sessionId = null;
        currentPairIndex = 0;
        dependencyPairs = [];
        
        // Reset form fields
        document.getElementById('name').value = '';
        document.getElementById('position').value = '';
        document.getElementById('email').value = '';
        
        // Reset variables
        const defaultVariables = ['Variable 1', 'Variable 2', 'Variable 3', 'Variable 4', 'Variable 5'];
        const variableInputs = document.querySelectorAll('.variable-input');
        
        // If there are more variable inputs than defaults, remove extras
        while (variableList.children.length > defaultVariables.length) {
            variableList.removeChild(variableList.lastChild);
        }
        
        // If there are less variable inputs than defaults, add more
        while (variableList.children.length < defaultVariables.length) {
            addVariable();
        }
        
        // Reset values
        variableInputs.forEach((input, index) => {
            input.value = '';
            input.placeholder = defaultVariables[index] || 'Variable';
        });
        
        // Reset steps
        step1.classList.remove('completed');
        step2.classList.remove('active', 'completed');
        step3.classList.remove('active', 'completed');
        
        // Reset panels
        panelComplete.classList.remove('active');
        panel1.classList.add('active');
    });
    
    // Variable management
    addVariableBtn.addEventListener('click', function() {
        addVariable();
    });
    
    // Modal
    closeModalBtn.addEventListener('click', function() {
        errorModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === errorModal) {
            errorModal.style.display = 'none';
        }
    });
    
    // Functions
    function addVariable() {
        const itemCount = variableList.children.length;
        const newItem = document.createElement('div');
        newItem.className = 'variable-item';
        newItem.innerHTML = `
            <input type="text" placeholder="Variable ${itemCount + 1}" class="variable-input">
            <button class="btn delete-variable"><i class="fas fa-trash"></i></button>
        `;
        
        variableList.appendChild(newItem);
        
        // Add event listener to the delete button
        const deleteBtn = newItem.querySelector('.delete-variable');
        deleteBtn.addEventListener('click', function() {
            variableList.removeChild(newItem);
            updateVariablePlaceholders();
        });
    }
    
    function initDeleteVariableButtons() {
        const deleteButtons = document.querySelectorAll('.delete-variable');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Ensure we always have at least one variable
                if (variableList.children.length > 1) {
                    const variableItem = button.parentElement;
                    variableList.removeChild(variableItem);
                    updateVariablePlaceholders();
                } else {
                    showError('You must have at least one variable.');
                }
            });
        });
    }
    
    function updateVariablePlaceholders() {
        const variableInputs = document.querySelectorAll('.variable-input');
        variableInputs.forEach((input, index) => {
            input.placeholder = `Variable ${index + 1}`;
        });
    }
    
    function loadDependencyPairs() {
        fetch('/get_dependency_options?session_id=' + sessionId)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                dependencyPairs = data.pairs;
                currentPairIndex = 0;
                
                // Load initial graph
                fetch('/get_current_graph?session_id=' + sessionId)
                .then(response => response.json())
                .then(graphData => {
                    if (graphData.success) {
                        graphImage.src = graphData.image;
                        
                        // Display first dependency question
                        if (dependencyPairs.length > 0) {
                            displayDependencyQuestion();
                        } else {
                            dependencyQuestion.innerHTML = `
                                <p>No variable dependencies to define.</p>
                            `;
                        }
                    }
                });
            } else {
                showError(data.error || 'An error occurred while loading dependency options.');
            }
        })
        .catch(error => {
            showError('An error occurred while loading dependency options.');
            console.error('Error:', error);
        });
    }
    
    function displayDependencyQuestion() {
        if (currentPairIndex < dependencyPairs.length) {
            const pair = dependencyPairs[currentPairIndex];
            
            dependencyQuestion.innerHTML = `
                <p>Does <strong>${pair.source}</strong> affect <strong>${pair.target}</strong>?</p>
                <div class="dependency-btns">
                    <button class="btn yes" id="yes-dependency">Yes <i class="fas fa-check"></i></button>
                    <button class="btn no" id="no-dependency">No <i class="fas fa-times"></i></button>
                </div>
            `;
            
            // Add event listeners to buttons
            document.getElementById('yes-dependency').addEventListener('click', function() {
                addDependency(pair.source, pair.target);
            });
            
            document.getElementById('no-dependency').addEventListener('click', function() {
                // Just move to the next question
                currentPairIndex++;
                displayDependencyQuestion();
            });
        } else {
            // All dependencies defined
            dependencyQuestion.innerHTML = `
                <p>All possible dependencies have been defined.</p>
                <p>Click the Finish button to complete the analysis.</p>
            `;
        }
    }
    
    function addDependency(source, target) {
        fetch('/add_dependency', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                session_id: sessionId, 
                source: source, 
                target: target 
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update graph image
                graphImage.src = data.image;
                
                // Move to next question
                currentPairIndex++;
                displayDependencyQuestion();
            } else {
                // Show error but keep on the same question
                showError(data.error || 'An error occurred while adding dependency.');
                
                // Update graph anyway to show current state
                if (data.image) {
                    graphImage.src = data.image;
                }
            }
        })
        .catch(error => {
            showError('An error occurred while adding dependency.');
            console.error('Error:', error);
        });
    }
    
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    }
});