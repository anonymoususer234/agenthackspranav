/**
 * PokerNow GTO Copilot - UI Component
 * Creates and manages the copilot sidebar interface
 */

class CopilotUI {
    constructor(gtoAdvisor, parser) {
        this.advisor = gtoAdvisor;
        this.parser = parser;
        this.isVisible = true;
        this.isMinimized = false;
        this.currentAdvice = null;
        
        // Blind level configuration
        this.blindLevels = {
            smallBlind: 0.5,
            bigBlind: 1.0
        };
        
        this.ui = {
            container: null,
            header: null,
            content: null,
            advice: null,
            gameInfo: null,
            toggleButton: null
        };
        
        this.animations = {
            fadeIn: 'copilot-fade-in 0.3s ease-out',
            slideIn: 'copilot-slide-in 0.3s ease-out',
            pulse: 'copilot-pulse 1s infinite'
        };
    }

    /**
     * Initialize and inject the copilot UI
     */
    initialize() {
        console.log('🎯 PokerNow Copilot: Initializing UI...');
        
        this.createCopilotContainer();
        this.setupEventListeners();
        this.startAdviceUpdates();
        
        console.log('🎯 PokerNow Copilot: UI active!');
    }

    /**
     * Create the main copilot container and UI elements
     */
    createCopilotContainer() {
        // Remove any existing copilot
        const existingCopilot = document.getElementById('pokernow-copilot');
        if (existingCopilot) {
            existingCopilot.remove();
        }

        // Create main container
        this.ui.container = document.createElement('div');
        this.ui.container.id = 'pokernow-copilot';
        this.ui.container.className = 'copilot-container';
        
        // Create header
        this.ui.header = document.createElement('div');
        this.ui.header.className = 'copilot-header';
        this.ui.header.innerHTML = `
            <div class="copilot-title">
                <span class="copilot-title-text">GTO Copilot</span>
                <div class="copilot-status">
                    <span class="status-indicator"></span>
                    <span class="status-text">Analyzing...</span>
                </div>
            </div>
            <div class="copilot-controls">
                <button class="copilot-btn copilot-settings" title="Settings">⚙️</button>
                <button class="copilot-btn copilot-minimize" title="Minimize">−</button>
                <button class="copilot-btn copilot-close" title="Close">×</button>
            </div>
        `;

        // Create content area
        this.ui.content = document.createElement('div');
        this.ui.content.className = 'copilot-content';
        
        // Create game info section
        this.ui.gameInfo = document.createElement('div');
        this.ui.gameInfo.className = 'copilot-game-info';
        this.ui.gameInfo.innerHTML = `
            <div class="game-status">
                <div class="game-indicator">
                    <span class="game-status-dot"></span>
                    <span class="game-status-text">Waiting for game...</span>
                </div>
            </div>
            <div class="blind-controls" style="margin: 8px 0; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 6px;">
                <div style="color: #00ff88; font-weight: 600; margin-bottom: 6px; font-size: 12px;">Blind Levels</div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="flex: 1;">
                        <label style="font-size: 11px; color: #ffffff;">Small Blind:</label>
                        <input type="number" class="blind-input sb-input" value="0.5" min="0.01" step="0.01" 
                               style="width: 100%; padding: 4px; border: 1px solid #00ff88; background: #000; color: #00ff88; border-radius: 4px; font-size: 11px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 11px; color: #ffffff;">Big Blind:</label>
                        <input type="number" class="blind-input bb-input" value="1.00" min="0.02" step="0.01"
                               style="width: 100%; padding: 4px; border: 1px solid #00ff88; background: #000; color: #00ff88; border-radius: 4px; font-size: 11px;">
                    </div>
                    <button class="copilot-btn-secondary update-blinds" style="padding: 4px 8px; font-size: 11px; margin-top: 16px;">Update</button>
                </div>
            </div>
            <div class="cards-display-main" style="margin: 8px 0; padding: 8px; background: rgba(0, 255, 136, 0.05); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 8px;">
                <div class="hole-cards" style="margin-bottom: 8px;">
                    <span class="label">Your Cards:</span>
                    <div class="cards"></div>
                </div>
                <div class="board-cards">
                    <span class="label">Board:</span>
                    <div class="cards"></div>
                </div>
            </div>
        `;

        // Create advice section
        this.ui.advice = document.createElement('div');
        this.ui.advice.className = 'copilot-advice';
        this.ui.advice.innerHTML = `
            <div class="advice-header">
                <h3>RECOMMENDED ACTION</h3>
                <div class="confidence-badge">
                    <span class="confidence-level">--</span>
                    <span class="confidence-text">Confidence</span>
                </div>
            </div>
            <div class="advice-content">
                <div class="primary-action" style="background: rgba(0, 255, 136, 0.1); border: 2px solid #00ff88; border-radius: 8px; padding: 15px; margin: 10px 0; text-align: center;">
                    <div class="action-recommendation">
                        <span class="action-text" style="font-size: 18px; font-weight: 700; color: #00ff88; text-transform: uppercase; letter-spacing: 1px;">Waiting for hand...</span>
                        <span class="action-amount" style="font-size: 16px; font-weight: 700; color: #ffffff;"></span>
                    </div>
                    <div class="action-reasoning" style="margin-top: 8px; font-size: 12px; color: #ffffff;">
                        Connect to a poker game to receive GTO advice
                    </div>
                </div>
                <div class="detailed-stats" style="display: none;">
                    <div class="stat-row">
                        <span class="stat-name">Hand Strength:</span>
                        <span class="stat-value hand-strength">--</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-name">Equity:</span>
                        <span class="stat-value equity">--</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-name">Outs:</span>
                        <span class="stat-value outs">--</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-name">Pot Odds:</span>
                        <span class="stat-value pot-odds">--</span>
                    </div>
                </div>
            </div>
            <div class="advice-footer">
                <button class="copilot-btn-primary force-update">Refresh</button>
            </div>
        `;

        // Create hidden game context section (all detailed game info)
        const gameContextSection = document.createElement('div');
        gameContextSection.className = 'game-context-section';
        gameContextSection.style.display = 'none';
        gameContextSection.innerHTML = `
            <div class="hand-info">
                <div class="cards-display">
                    <div class="hole-cards">
                        <span class="label">Your Cards:</span>
                        <div class="cards"></div>
                    </div>
                    <div class="board-cards">
                        <span class="label">Board:</span>
                        <div class="cards"></div>
                    </div>
                </div>
                <div class="game-stats">
                    <div class="stat">
                        <span class="stat-label">Pot:</span>
                        <span class="stat-value pot-size">$0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">To Call:</span>
                        <span class="stat-value to-call">$0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Stack:</span>
                        <span class="stat-value stack-size">$100</span>
                    </div>
                </div>
                <div class="position-info" style="margin-top: 8px;">
                    <div class="stat">
                        <span class="stat-label">Position:</span>
                        <span class="stat-value position-name">--</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Facing:</span>
                        <span class="stat-value facing-bet">$0</span>
                    </div>
                </div>
                <div class="stack-analysis" style="margin-top: 8px; padding: 6px; background: rgba(0, 255, 136, 0.03); border-radius: 4px;">
                    <div style="font-size: 11px; color: #00ff88; margin-bottom: 2px;">Stack Analysis:</div>
                    <div style="font-size: 10px; color: #ffffff;">
                        <span class="stack-bb-ratio">-- BB</span> • 
                        <span class="stack-depth-category">--</span>
                    </div>
                </div>
                <div class="opponent-info" style="margin-top: 8px; display: none;">
                    <div class="opponent-bets-container">
                        <span class="stat-label">Opponent Bets:</span>
                        <div class="opponent-bets-list"></div>
                    </div>
                </div>
            </div>
        `;

        // Insert the button and hidden section after blind controls
        const blindControls = this.ui.gameInfo.querySelector('.blind-controls');
        blindControls.insertAdjacentElement('afterend', gameContextSection);
        
        // Assemble the UI
        this.ui.content.appendChild(this.ui.gameInfo);
        this.ui.content.appendChild(this.ui.advice);
        
        // Add show more details button
        const gameDetailsToggle = document.createElement('button');
        gameDetailsToggle.className = 'show-details-btn';
        gameDetailsToggle.textContent = 'Show More Details';
        gameDetailsToggle.style.cssText = `
            width: calc(100% - 30px);
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            border: none;
            color: #000000;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 12px 15px 8px 15px;
            display: block;
        `;
        
        this.ui.content.appendChild(gameDetailsToggle);
        
        // Add chat assistant button
        const chatButton = document.createElement('button');
        chatButton.className = 'chat-assistant-btn';
        chatButton.textContent = 'Chat with your personal assistant';
        chatButton.style.cssText = `
            width: calc(100% - 30px);
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            border: none;
            color: #ffffff;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 4px 15px 12px 15px;
            display: block;
        `;
        
        this.ui.content.appendChild(chatButton);
        
        // Add click handler for details toggle
        gameDetailsToggle.addEventListener('click', () => {
            const gameContextSection = this.ui.container.querySelector('.game-context-section');
            const isHidden = gameContextSection.style.display === 'none';
            if (isHidden) {
                gameContextSection.style.display = 'block';
                gameDetailsToggle.textContent = 'Hide Details';
                gameDetailsToggle.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)';
            } else {
                gameContextSection.style.display = 'none';
                gameDetailsToggle.textContent = 'Show More Details';
                gameDetailsToggle.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';
            }
        });
        
        // Add click handler for chat assistant
        chatButton.addEventListener('click', () => {
            this.openChatAssistant();
        });

        this.ui.container.appendChild(this.ui.header);
        this.ui.container.appendChild(this.ui.content);

        // Inject into page
        document.body.appendChild(this.ui.container);

        // Store references to frequently used elements
        this.cacheUIElements();
        
        // Initialize blind levels
        this.initializeBlindLevels();
        
        // Initialize card display with placeholders
        this.updateCards([], []);
        
        // Show with animation
        this.ui.container.style.animation = this.animations.slideIn;
    }

    /**
     * Cache frequently used UI elements
     */
    cacheUIElements() {
        this.elements = {
            statusIndicator: this.ui.container.querySelector('.status-indicator'),
            statusText: this.ui.container.querySelector('.status-text'),
            gameStatusDot: this.ui.container.querySelector('.game-status-dot'),
            gameStatusText: this.ui.container.querySelector('.game-status-text'),
            handInfo: this.ui.container.querySelector('.hand-info'),
            holeCards: this.ui.container.querySelector('.cards-display-main .hole-cards .cards'),
            boardCards: this.ui.container.querySelector('.cards-display-main .board-cards .cards'),
            potSize: this.ui.container.querySelector('.pot-size'),
            toCall: this.ui.container.querySelector('.to-call'),
            stackSize: this.ui.container.querySelector('.stack-size'),
            confidenceLevel: this.ui.container.querySelector('.confidence-level'),
            confidenceBadge: this.ui.container.querySelector('.confidence-badge'),
            actionText: this.ui.container.querySelector('.action-text'),
            actionAmount: this.ui.container.querySelector('.action-amount'),
            actionReasoning: this.ui.container.querySelector('.action-reasoning'),
            detailedStats: this.ui.container.querySelector('.detailed-stats'),
            handStrength: this.ui.container.querySelector('.hand-strength'),
            equity: this.ui.container.querySelector('.equity'),
            outs: this.ui.container.querySelector('.outs'),
            potOdds: this.ui.container.querySelector('.pot-odds'),
            positionName: this.ui.container.querySelector('.position-name'),
            facingBet: this.ui.container.querySelector('.facing-bet'),
            opponentInfo: this.ui.container.querySelector('.opponent-info'),
            opponentBetsList: this.ui.container.querySelector('.opponent-bets-list'),
            // Blind control elements
            sbInput: this.ui.container.querySelector('.sb-input'),
            bbInput: this.ui.container.querySelector('.bb-input'),
            updateBlindsBtn: this.ui.container.querySelector('.update-blinds'),
            // Stack analysis elements
            stackBBRatio: this.ui.container.querySelector('.stack-bb-ratio'),
            stackDepthCategory: this.ui.container.querySelector('.stack-depth-category'),
            // Game context section
            gameContextSection: this.ui.container.querySelector('.game-context-section')
        };
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Header controls
        this.ui.container.querySelector('.copilot-settings').addEventListener('click', () => {
            this.openSettings();
        });

        this.ui.container.querySelector('.copilot-minimize').addEventListener('click', () => {
            this.toggleMinimize();
        });

        this.ui.container.querySelector('.copilot-close').addEventListener('click', () => {
            this.hide();
        });

        // Advice controls
        this.ui.container.querySelector('.force-update').addEventListener('click', () => {
            this.forceUpdate();
        });

        // Blind level controls
        this.ui.container.querySelector('.update-blinds').addEventListener('click', () => {
            this.updateBlindLevels();
        });

        // Auto-update blinds when values change
        this.ui.container.querySelector('.sb-input').addEventListener('change', () => {
            this.updateBlindLevels();
        });

        this.ui.container.querySelector('.bb-input').addEventListener('change', () => {
            this.updateBlindLevels();
        });

        // Game state updates
        document.addEventListener('pokerGameStateUpdate', (event) => {
            this.updateGameState(event.detail);
        });

        // Draggable functionality
        this.makeDraggable();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Make the copilot draggable
     */
    makeDraggable() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        this.ui.header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('copilot-btn')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            this.ui.header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                this.ui.container.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.ui.header.style.cursor = 'grab';
        });
    }

    /**
     * Update the UI with current game state
     */
    updateGameState(gameState) {
        console.log('🎯 UI updateGameState called:', gameState);
        
        // Update status with more detailed information
        if (gameState.isActive) {
            this.elements.gameStatusDot.className = 'game-status-dot active';
            
            let statusText = 'In Game';
            if (gameState.isMyTurn) {
                statusText = 'YOUR TURN!';
            } else if (gameState.waitingForAction) {
                statusText = 'Opponent Acting...';
            }
            
            this.elements.gameStatusText.textContent = statusText;
            // Note: hand-info is now inside game context section which is hidden by default
            
            this.elements.statusIndicator.className = 'status-indicator active';
            this.elements.statusText.textContent = 'Analyzing';
        } else {
            this.elements.gameStatusDot.className = 'game-status-dot';
            
            // Show debugging info when no game detected
            const debugText = `Searching... (v2.1 - Enhanced Detection)`;
            this.elements.gameStatusText.textContent = debugText;
            // Note: hand-info is now inside game context section which is hidden by default
            
            this.elements.statusIndicator.className = 'status-indicator';
            this.elements.statusText.textContent = 'Searching for game...';
        }

        // Update cards
        this.updateCards(gameState.holeCards, gameState.boardCards);

        // Update game stats
        this.elements.potSize.textContent = `$${Math.round(gameState.potSize)}`;
        this.elements.toCall.textContent = `$${Math.round(gameState.toCall)}`;
        this.elements.stackSize.textContent = `$${Math.round(gameState.stackSize)}`;

        // Update position and betting info
        this.elements.positionName.textContent = gameState.positionName || '--';
        this.elements.facingBet.textContent = `$${Math.round(gameState.facingBet || 0)}`;
        
        // Update stack analysis with current blind levels
        const stackBBs = gameState.stackSize / this.blindLevels.bigBlind;
        let stackCategory;
        if (stackBBs < 20) stackCategory = 'Very Short';
        else if (stackBBs < 40) stackCategory = 'Short';
        else if (stackBBs < 100) stackCategory = 'Medium';
        else if (stackBBs < 200) stackCategory = 'Deep';
        else stackCategory = 'Very Deep';
        
        this.elements.stackBBRatio.textContent = `${Math.round(stackBBs)} BB`;
        this.elements.stackDepthCategory.textContent = stackCategory;
        
        // Update opponent betting info
        if (gameState.opponentBets && gameState.opponentBets.length > 0) {
            this.elements.opponentInfo.style.display = 'block';
            this.updateOpponentBets(gameState.opponentBets);
        } else {
            this.elements.opponentInfo.style.display = 'none';
        }

        // Get and update advice with frequencies and custom blind levels
        if (gameState.isActive && gameState.holeCards.length === 2) {
            // Pass blind levels to advisor before getting advice
            this.advisor.updateBlindLevels(this.blindLevels);
            this.updateAdvice(gameState);
        } else {
            this.clearAdvice();
        }
    }

    /**
     * Update card displays
     */
    updateCards(holeCards = [], boardCards = []) {
        console.log('🃏 Updating cards:', { holeCards, boardCards });
        
        // Update hole cards
        if (this.elements.holeCards) {
            this.elements.holeCards.innerHTML = '';
            
            // Always show 2 hole card slots
            for (let i = 0; i < 2; i++) {
                if (i < holeCards.length && holeCards[i]) {
                    const cardElement = this.createCardElement(holeCards[i]);
                    this.elements.holeCards.appendChild(cardElement);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'card-placeholder';
                    placeholder.textContent = '?';
                    this.elements.holeCards.appendChild(placeholder);
                }
            }
        }

        // Update board cards
        if (this.elements.boardCards) {
            this.elements.boardCards.innerHTML = '';
            
            // Always show 5 board card slots
            for (let i = 0; i < 5; i++) {
                if (i < boardCards.length && boardCards[i]) {
                    const cardElement = this.createCardElement(boardCards[i]);
                    this.elements.boardCards.appendChild(cardElement);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'card-placeholder';
                    placeholder.textContent = '?';
                    this.elements.boardCards.appendChild(placeholder);
                }
            }
        }
    }

    /**
     * Create a card display element
     */
    createCardElement(card) {
        const cardEl = document.createElement('div');
        cardEl.className = 'poker-card';
        
        const suitSymbols = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };
        const suitColors = { 's': '#000', 'h': '#e74c3c', 'd': '#e74c3c', 'c': '#000' };
        
        let rank, suit;
        
        // Handle different card formats
        if (typeof card === 'object' && card.rank && card.suit) {
            // Card object format
            rank = card.rank;
            suit = card.suit;
        } else if (typeof card === 'string' && card.length >= 2) {
            // String format like "Ah", "Kd", etc.
            rank = card.slice(0, -1);
            suit = card.slice(-1);
        } else {
            // Invalid or unknown format
            console.warn('🃏 Invalid card format in createCardElement:', card);
            rank = '?';
            suit = 's';
        }
        
        const suitSymbol = suitSymbols[suit] || suit;
        const suitColor = suitColors[suit] || '#000';
        
        cardEl.innerHTML = `
            <span class="card-rank">${rank}</span>
            <span class="card-suit" style="color: ${suitColor}">${suitSymbol}</span>
        `;
        
        return cardEl;
    }

    /**
     * Update advice display with comprehensive GTO analysis
     */
    updateAdvice(gameState) {
        try {
            const advice = this.advisor.getAdvice(gameState);
            this.currentAdvice = advice;

            // Update confidence (primary action frequency)
            this.elements.confidenceLevel.textContent = `${Math.round(parseFloat(advice.confidence))}%`;
            this.elements.confidenceBadge.style.background = this.advisor.getConfidenceColor(advice.confidence);

            // Update primary action with frequency and purpose
            let primaryActionHtml = `
                <div class="primary-action-main">${this.advisor.getPrimaryActionDisplay(advice.primaryAction, advice.strategy)}</div>
                <div class="strategy-frequencies">${this.advisor.getStrategyDisplay(advice.strategy)}</div>
            `;
            
            // Add betting purpose and hand type
            if (advice.bettingPurpose && advice.handType) {
                const purposeColor = this.getPurposeColor(advice.bettingPurpose);
                primaryActionHtml += `
                    <div class="betting-analysis" style="margin-top: 8px; font-size: 11px;">
                        <span class="hand-type" style="color: #00ff88; font-weight: 600;">${this.formatHandType(advice.handType)}</span>
                        <span class="betting-purpose" style="color: ${purposeColor}; font-weight: 600; margin-left: 8px;">
                            ${this.formatBettingPurpose(advice.bettingPurpose)}
                        </span>
                    </div>
                `;
            }
            
            this.elements.actionText.innerHTML = primaryActionHtml;
            
            if (advice.betSize && advice.betSize > 0) {
                this.elements.actionAmount.textContent = `$${Math.round(advice.betSize)}`;
                this.elements.actionAmount.style.display = 'inline';
            } else {
                this.elements.actionAmount.style.display = 'none';
            }

            this.elements.actionReasoning.innerHTML = this.formatReasoning(advice.reasoning);

            // Update detailed stats with comprehensive information
            if (advice.handStrength !== undefined) {
                this.elements.handStrength.textContent = `${Math.round(advice.handStrength)}%`;
            }
            
            // Enhanced equity display
            if (advice.equity !== undefined) {
                const equityText = typeof advice.equity === 'number' 
                    ? `${Math.round(advice.equity)}%` 
                    : advice.equity;
                this.elements.equity.textContent = equityText;
            }
            
            if (advice.outs) {
                this.elements.outs.textContent = advice.outs;
            }
            if (advice.potOdds) {
                this.elements.potOdds.textContent = advice.potOdds;
            }

            // Add comprehensive analysis panel
            this.updateComprehensiveAnalysis(advice, gameState);

            // Add frequency bars for visual representation
            this.addFrequencyBars(advice.strategy);

            // Add urgency animation if it's player's turn
            if (gameState.isMyTurn) {
                this.elements.confidenceBadge.style.animation = this.animations.pulse;
            } else {
                this.elements.confidenceBadge.style.animation = 'none';
            }
            
        } catch (error) {
            console.error('❌ Error getting GTO advice:', error);
            
            // Provide fallback advice when there's an error
            this.showFallbackAdvice(gameState, error);
        }
    }

    /**
     * Show fallback advice when the main advisor fails
     */
    showFallbackAdvice(gameState, error) {
        // Basic fallback advice based on simple game state
        let fallbackAction = 'Check';
        let fallbackReasoning = 'Basic advice due to parsing error. ';
        let confidence = 50;
        
        // Simple heuristics for fallback advice
        if (gameState.toCall > 0) {
            if (gameState.toCall < gameState.potSize * 0.3) {
                fallbackAction = 'Call';
                fallbackReasoning += 'Small bet relative to pot size.';
                confidence = 60;
            } else {
                fallbackAction = 'Fold';
                fallbackReasoning += 'Large bet - be cautious.';
                confidence = 70;
            }
        } else if (gameState.isMyTurn) {
            fallbackAction = 'Check';
            fallbackReasoning += 'No bet to face - check to see more cards.';
            confidence = 55;
        }
        
        // Update UI with fallback advice
        this.elements.confidenceLevel.textContent = `${confidence}%`;
        this.elements.confidenceBadge.style.background = 'rgba(255, 255, 255, 0.2)';
        
        this.elements.actionText.innerHTML = `
            <div class="primary-action-main">${fallbackAction} (${confidence}%)</div>
            <div class="strategy-frequencies">Basic fallback advice</div>
        `;
        
        this.elements.actionAmount.style.display = 'none';
        this.elements.actionReasoning.innerHTML = fallbackReasoning + `<br><small style="color: #ffffff;">Error: ${error.message}</small>`;
        
        // Clear detailed stats
        this.elements.handStrength.textContent = '--';
        this.elements.equity.textContent = '--';
        this.elements.outs.textContent = '--';
        this.elements.potOdds.textContent = '--';
        
        // Remove any existing frequency bars
        const existingBars = this.ui.advice.querySelector('.frequency-bars');
        if (existingBars) {
            existingBars.remove();
        }
        
        console.log('🔧 Fallback advice provided due to error:', error);
    }

    /**
     * Update comprehensive analysis panel
     */
    updateComprehensiveAnalysis(advice, gameState) {
        // Remove existing comprehensive analysis from both locations
        const existingAnalysisAdvice = this.ui.advice.querySelector('.comprehensive-analysis');
        if (existingAnalysisAdvice) {
            existingAnalysisAdvice.remove();
        }
        
        const existingAnalysisContext = this.elements.gameContextSection.querySelector('.comprehensive-analysis');
        if (existingAnalysisContext) {
            existingAnalysisContext.remove();
        }

        // Create comprehensive analysis panel
        const analysisPanel = document.createElement('div');
        analysisPanel.className = 'comprehensive-analysis';
        analysisPanel.style.cssText = `
            margin-top: 15px;
            padding: 12px;
            background: rgba(0, 255, 136, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 136, 0.2);
            font-size: 11px;
            line-height: 1.4;
        `;

        let analysisHtml = '';

        // Game context section
        analysisHtml += `
            <div class="analysis-section" style="margin-bottom: 10px;">
                <div style="color: #00ff88; font-weight: 600; margin-bottom: 4px;">Game Context</div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                    <span style="color: #ffffff;">Position: <strong style="color: #00ff88;">${gameState.positionName || advice.position}</strong></span>
                    <span style="color: #ffffff;">Street: <strong style="color: #00ff88;">${gameState.street || 'preflop'}</strong></span>
                </div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; margin-top: 2px;">
                    <span style="color: #ffffff;">Players: <strong style="color: #00ff88;">${gameState.activePlayers || 2}</strong></span>
                    <span style="color: #ffffff;">Stack: <strong style="color: #00ff88;">$${gameState.stackSize}</strong></span>
                </div>
                ${advice.stackDepthInfo ? `<div style="margin-top: 2px; font-size: 10px; color: #ffffff;">Stack Analysis: <strong style="color: #00ff88;">${advice.stackDepthInfo.description}</strong></div>` : ''}
            </div>
        `;

        // Our strategic approach section
        if (advice.bettingPurpose) {
            const approachExplanation = this.getApproachExplanation(advice.bettingPurpose, advice.handType);
            analysisHtml += `
                <div class="analysis-section" style="margin-bottom: 10px;">
                    <div style="color: #00ff88; font-weight: 600; margin-bottom: 4px;">Our Approach</div>
                    <div style="color: #ffffff; font-size: 10px;">${approachExplanation}</div>
                </div>
            `;
        }

        // Opponent range analysis
        if (advice.detailedOpponentRange) {
            const oppRange = advice.detailedOpponentRange;
            analysisHtml += `
                <div class="analysis-section" style="margin-bottom: 10px;">
                    <div style="color: #00ff88; font-weight: 600; margin-bottom: 4px;">Opponent Analysis</div>
                    <div style="margin-bottom: 4px;">
                        <span style="color: #ffffff; font-size: 10px;">Range Strength: </span>
                        <strong style="color: #00ff88;">${oppRange.strength}</strong>
                        <span style="color: #ffffff; font-size: 10px; margin-left: 8px;">Frequency: </span>
                        <strong style="color: #00ff88;">${oppRange.percentage}</strong>
                    </div>
                    <div style="color: #ffffff; font-size: 10px; margin-bottom: 2px;">${oppRange.description}</div>
                    <div style="color: #ffffff; font-size: 9px;">Action: ${oppRange.sizingContext}</div>
                </div>
            `;
        }

        // Board texture analysis (postflop)
        if (advice.boardTexture && gameState.boardCards && gameState.boardCards.length >= 3) {
            analysisHtml += `
                <div class="analysis-section" style="margin-bottom: 10px;">
                    <div style="color: #00ff88; font-weight: 600; margin-bottom: 4px;">Board Analysis</div>
                    <div style="color: #ffffff;">${advice.boardTexture}</div>
                </div>
            `;
        }

        // Equity and mathematical analysis
        if (advice.equity || advice.impliedOdds) {
            analysisHtml += `
                <div class="analysis-section" style="margin-bottom: 10px;">
                    <div style="color: #00ff88; font-weight: 600; margin-bottom: 4px;">Equity Analysis</div>
                    <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                        ${advice.equity ? `<span style="color: #ffffff;">Equity: <strong style="color: #00ff88;">${typeof advice.equity === 'number' ? Math.round(advice.equity) + '%' : advice.equity}</strong></span>` : ''}
                        ${advice.potOdds !== 'N/A' ? `<span style="color: #ffffff;">Pot Odds: <strong style="color: #00ff88;">${advice.potOdds}</strong></span>` : ''}
                    </div>
                    ${advice.impliedOdds ? `<div style="margin-top: 2px; color: #ffffff;">Implied Odds: <strong style="color: #00ff88;">${advice.impliedOdds}</strong></div>` : ''}
                </div>
            `;
        }

        // Strategy reasoning
        if (advice.reasoning) {
            analysisHtml += `
                <div class="analysis-section">
                    <div style="color: #00ff88; font-weight: 600; margin-bottom: 4px;">Strategy Logic</div>
                    <div style="color: #ffffff; font-size: 10px; font-style: italic;">${advice.reasoning}</div>
                </div>
            `;
        }

        analysisPanel.innerHTML = analysisHtml;

        // Insert into the game context section at the end
        this.elements.gameContextSection.querySelector('.hand-info').appendChild(analysisPanel);
    }

    /**
     * Format betting purpose for display
     */
    formatBettingPurpose(purpose) {
        const purposeMap = {
            'value': 'VALUE',
            'bluff': 'BLUFF', 
            'semi_bluff': 'SEMI-BLUFF',
            'mixed': 'MIXED',
            'fold': 'FOLD',
            'bluff_catcher': 'BLUFF CATCH'
        };
        return purposeMap[purpose] || purpose.toUpperCase();
    }

    /**
     * Format hand type for display
     */
    formatHandType(type) {
        const typeMap = {
            'premium': 'PREMIUM',
            'strong': 'STRONG',
            'medium': 'MEDIUM',
            'nuts_strong': 'NUTS/STRONG',
            'strong_made': 'STRONG MADE',
            'medium_made': 'MEDIUM MADE',
            'strong_draw': 'STRONG DRAW',
            'medium_draw': 'MEDIUM DRAW',
            'weak_draw': 'WEAK DRAW',
            'bluff_candidate': 'BLUFF CANDIDATE',
            'semi_bluff': 'SEMI-BLUFF',
            'air_bluff': 'AIR BLUFF',
            'air': 'AIR',
            'weak': 'WEAK'
        };
        return typeMap[type] || type.toUpperCase();
    }

    /**
     * Get color for betting purpose
     */
    getPurposeColor(purpose) {
        const colorMap = {
            'value': '#00ff88',
            'bluff': '#ffffff',
            'semi_bluff': '#00ff88',
            'mixed': '#00ff88',
            'fold': '#ffffff',
            'bluff_catcher': '#00ff88'
        };
        return colorMap[purpose] || '#ffffff';
    }

    /**
     * Format reasoning text with highlighting
     */
    formatReasoning(reasoning) {
        if (!reasoning) return '';
        
        // Highlight key terms
        let formatted = reasoning
            .replace(/(\d+\.?\d*%)/g, '<strong style="color: #00ff88;">$1</strong>')
            .replace(/(value|bluff|semi-bluff)/gi, '<strong style="color: #00ff88;">$1</strong>')
            .replace(/(fold|check)/gi, '<strong style="color: #ffffff;">$1</strong>')
            .replace(/(raise|bet|call)/gi, '<strong style="color: #00ff88;">$1</strong>')
            .replace(/(\$\d+)/g, '<strong style="color: #00ff88;">$1</strong>');
            
        return formatted;
    }

    /**
     * Toggle minimize state
     */
    toggleMinimize() {
        const button = this.ui.container.querySelector('.copilot-minimize');
        
        if (this.isMinimized) {
            this.ui.content.style.display = 'block';
            button.textContent = '−';
            this.isMinimized = false;
        } else {
            this.ui.content.style.display = 'none';
            button.textContent = '+';
            this.isMinimized = true;
        }
    }

    /**
     * Toggle copilot visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show copilot
     */
    show() {
        if (this.ui.container) {
            this.ui.container.style.display = 'block';
            this.ui.container.style.animation = this.animations.slideIn;
            this.isVisible = true;
        }
    }

    /**
     * Hide copilot
     */
    hide() {
        if (this.ui.container) {
            this.ui.container.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Force update advice
     */
    forceUpdate() {
        this.parser.forceUpdate();
        const button = this.ui.container.querySelector('.force-update');
        button.textContent = 'Refreshing...';
        
        setTimeout(() => {
            button.textContent = 'Refresh';
        }, 1000);
    }

    /**
     * Start periodic advice updates - now more frequent for real-time updates
     */
    startAdviceUpdates() {
        // Update advice every 1 second for real-time updates
        setInterval(() => {
            const gameState = this.parser.getGameState();
            if (gameState.isActive && gameState.holeCards.length === 2) {
                this.updateAdvice(gameState);
            }
        }, 1000);
    }

    /**
     * Show welcome message when copilot activates
     */
    showWelcomeMessage() {
        // Create welcome notification
        const welcome = document.createElement('div');
        welcome.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 600;
            animation: ${this.animations.slideIn};
            cursor: pointer;
            max-width: 300px;
        `;
        
        welcome.innerHTML = `
            <strong>GTO Copilot Active!</strong><br>
            <small style="font-weight: 400; opacity: 0.9;">
                • Press Ctrl+Shift+P to toggle<br>
                • Real-time strategy frequencies<br>
                • Updates automatically with each action
            </small>
        `;
        
        welcome.id = 'pokernow-copilot-welcome';
        
        document.body.appendChild(welcome);
        
        // Auto-remove after 6 seconds or on click
        const remove = () => {
            welcome.style.animation = 'copilot-fade-out 0.3s ease-out';
            setTimeout(() => welcome.remove(), 300);
        };
        
        welcome.addEventListener('click', remove);
        setTimeout(remove, 6000);
    }

    /**
     * Clear advice when not in game
     */
    clearAdvice() {
        this.elements.actionText.innerHTML = 'Waiting for hand...';
        this.elements.actionAmount.style.display = 'none';
        this.elements.actionReasoning.textContent = 'Join a poker game to receive real-time GTO strategy advice with frequencies';
        this.elements.confidenceLevel.textContent = '--';
        this.elements.confidenceBadge.style.background = '#6c757d';
        this.elements.confidenceBadge.style.animation = 'none';
        
        // Clear detailed stats
        this.elements.handStrength.textContent = '--';
        this.elements.equity.textContent = '--';
        this.elements.outs.textContent = '--';
        this.elements.potOdds.textContent = '--';

        // Remove frequency bars
        const existingBars = this.ui.advice.querySelector('.frequency-bars');
        if (existingBars) {
            existingBars.remove();
        }
    }

    /**
     * Update opponent bets
     */
    updateOpponentBets(opponentBets) {
        this.elements.opponentBetsList.innerHTML = '';
        opponentBets.forEach(player => {
            const betElement = document.createElement('div');
            betElement.className = 'opponent-bet';
            betElement.style.cssText = 'font-size: 11px; margin: 2px 0; color: #e0e0e0;';
            
            if (player.bet > 0) {
                betElement.textContent = `${player.name}: $${player.bet}`;
            } else {
                betElement.textContent = `${player.name}: Check`;
            }
            
            this.elements.opponentBetsList.appendChild(betElement);
        });
    }

    /**
     * Add visual frequency bars for each action
     */
    addFrequencyBars(strategy) {
        // Remove existing frequency bars
        const existingBars = this.ui.advice.querySelector('.frequency-bars');
        if (existingBars) {
            existingBars.remove();
        }

        // Create frequency bars container
        const barsContainer = document.createElement('div');
        barsContainer.className = 'frequency-bars';
        
        // Sort actions by frequency
        const sortedActions = Object.entries(strategy)
            .filter(([action, freq]) => freq > 0)
            .sort(([,a], [,b]) => b - a);

        sortedActions.forEach(([action, frequency]) => {
            const barWrapper = document.createElement('div');
            barWrapper.className = 'frequency-bar-wrapper';
            
            const barLabel = document.createElement('div');
            barLabel.className = 'frequency-bar-label';
            barLabel.textContent = `${this.advisor.capitalizeAction(action)}: ${frequency}%`;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'frequency-bar-container';
            
            const bar = document.createElement('div');
            bar.className = 'frequency-bar';
            bar.style.width = `${frequency}%`;
            bar.style.backgroundColor = this.advisor.getActionColor(action, frequency);
            
            barContainer.appendChild(bar);
            barWrapper.appendChild(barLabel);
            barWrapper.appendChild(barContainer);
            barsContainer.appendChild(barWrapper);
        });

        // Insert after the action recommendation
        const actionRecommendation = this.ui.advice.querySelector('.action-recommendation');
        actionRecommendation.insertAdjacentElement('afterend', barsContainer);
    }

    /**
     * Update blind levels
     */
    updateBlindLevels() {
        this.blindLevels.smallBlind = parseFloat(this.elements.sbInput.value) || 1;
        this.blindLevels.bigBlind = parseFloat(this.elements.bbInput.value) || 2;
        this.advisor.updateBlindLevels(this.blindLevels);
        // Recalculate stack depth and update advice
        const gameState = this.parser.getGameState();
        if (gameState && gameState.isActive) {
            this.updateAdvice(gameState);
        }
    }

    /**
     * Get approach explanation for betting purpose
     */
    getApproachExplanation(purpose, handType) {
        const explanations = {
            'value': {
                'premium': 'Betting aggressively for maximum value with our premium hand. We want to build the pot and get called by weaker hands.',
                'strong': 'Betting for value with our strong hand. We aim to extract value from medium-strength hands and draws.',
                'nuts_strong': 'Betting heavily for value with our monster hand. We want to charge draws and get maximum value.',
                'strong_made': 'Betting our strong made hand for value, protecting against draws and building the pot.',
                'default': 'Betting for value - we have a strong enough hand to get called by worse hands.'
            },
            'bluff': {
                'bluff_candidate': 'Pure bluffing with our weak hand. We\'re representing strength to fold out better hands.',
                'air_bluff': 'Bluffing with complete air. We need fold equity to make this profitable.',
                'weak': 'Bluffing with our weak hand, trying to win the pot immediately through fold equity.',
                'default': 'Bluffing - representing a strong hand to make better hands fold.'
            },
            'semi_bluff': {
                'strong_draw': 'Semi-bluffing with our strong draw. We have good equity if called and fold equity against weak hands.',
                'medium_draw': 'Semi-bluffing with our draw. We have backup equity plus the chance to win immediately.',
                'weak_draw': 'Semi-bluffing with limited equity. We\'re relying more on fold equity than card equity.',
                'default': 'Semi-bluffing - betting with a drawing hand that has equity if called.'
            },
            'mixed': {
                'medium': 'Mixed strategy with our medium-strength hand. Sometimes betting for thin value, sometimes controlling pot size.',
                'medium_made': 'Playing mixed strategy for pot control and thin value extraction.',
                'default': 'Mixed approach - our hand strength allows for multiple profitable strategies.'
            },
            'bluff_catcher': {
                'weak_draw': 'Calling as a bluff catcher. Our hand beats bluffs but loses to value bets.',
                'default': 'Playing as bluff catcher - calling to catch opponent bluffs while folding to heavy pressure.'
            },
            'fold': {
                'air': 'Folding our weak hand. We have insufficient equity and no profitable bluffing opportunity.',
                'weak': 'Folding due to unfavorable pot odds and weak hand strength.',
                'default': 'Folding - our hand is too weak to continue profitably.'
            }
        };

        const purposeExplanations = explanations[purpose] || explanations['mixed'];
        return purposeExplanations[handType] || purposeExplanations['default'] || 'Strategic approach based on hand strength and position.';
    }

    /**
     * Get range strength color
     */
    getRangeStrengthColor(strength) {
        const colorMap = {
            'Ultra Strong': '#8e44ad',
            'Very Strong': '#c0392b', 
            'Strong': '#e74c3c',
            'Medium-Strong': '#f39c12',
            'Medium': '#f1c40f',
            'Wide': '#27ae60',
            'Polarized': '#3498db',
            'Unknown': '#95a5a6'
        };
        return colorMap[strength] || '#ecf0f1';
    }

    /**
     * Initialize blind levels
     */
    initializeBlindLevels() {
        this.blindLevels.smallBlind = parseFloat(this.elements.sbInput.value) || 1;
        this.blindLevels.bigBlind = parseFloat(this.elements.bbInput.value) || 2;
        this.advisor.updateBlindLevels(this.blindLevels);
    }

    /**
     * Open chat assistant
     */
    openChatAssistant() {
        // Check if chat window already exists
        if (document.getElementById('chat-assistant-window')) {
            document.getElementById('chat-assistant-window').style.display = 'flex';
            return;
        }

        // Create chat window overlay
        const chatOverlay = document.createElement('div');
        chatOverlay.id = 'chat-assistant-window';
        chatOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10002;
            backdrop-filter: blur(5px);
        `;

        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.style.cssText = `
            width: 90%;
            max-width: 800px;
            height: 80%;
            max-height: 600px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 15px;
            border: 2px solid #00ff88;
            box-shadow: 0 20px 60px rgba(0, 255, 136, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        // Create chat header
        const chatHeader = document.createElement('div');
        chatHeader.style.cssText = `
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            color: #000000;
            padding: 20px;
            font-weight: 700;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        chatHeader.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="margin-right: 10px;">🤖</span>
                <span>GTO Assistant</span>
                <span style="font-size: 12px; font-weight: 400; margin-left: 10px; opacity: 0.8;">Powered by Claude</span>
            </div>
            <button id="close-chat" style="background: none; border: none; color: #000000; font-size: 24px; cursor: pointer; padding: 5px;">×</button>
        `;

        // Create chat messages area
        const chatMessages = document.createElement('div');
        chatMessages.id = 'chat-messages';
        chatMessages.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #1a1a1a;
            display: flex;
            flex-direction: column;
            gap: 15px;
        `;

        // Add welcome message
        chatMessages.innerHTML = `
            <div class="message assistant-message" style="
                background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
                color: #000000;
                padding: 15px 20px;
                border-radius: 20px 20px 20px 5px;
                max-width: 80%;
                align-self: flex-start;
                font-weight: 600;
                box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
            ">
                👋 Hi! I'm your personal GTO assistant. I can analyze your current hand, discuss strategy, explain opponent ranges, or help with any poker questions. What would you like to know?
            </div>
        `;

        // Create typing indicator (hidden by default)
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typing-indicator';
        typingIndicator.style.cssText = `
            background: #333333;
            color: #ffffff;
            padding: 15px 20px;
            border-radius: 20px 20px 20px 5px;
            max-width: 80%;
            align-self: flex-start;
            font-style: italic;
            display: none;
            animation: pulse 1.5s infinite;
        `;
        typingIndicator.textContent = 'Assistant is thinking...';
        chatMessages.appendChild(typingIndicator);

        // Create input area
        const chatInput = document.createElement('div');
        chatInput.style.cssText = `
            background: #2d2d2d;
            border-top: 1px solid #00ff88;
            padding: 20px;
            display: flex;
            gap: 15px;
            align-items: center;
        `;

        const messageInput = document.createElement('textarea');
        messageInput.id = 'message-input';
        messageInput.placeholder = 'Ask about your hand, strategy, ranges, or any poker question...';
        messageInput.style.cssText = `
            flex: 1;
            background: #1a1a1a;
            border: 2px solid #444444;
            border-radius: 10px;
            color: #ffffff;
            padding: 15px;
            font-size: 14px;
            font-family: inherit;
            resize: none;
            min-height: 50px;
            max-height: 100px;
            transition: border-color 0.3s ease;
        `;

        const sendButton = document.createElement('button');
        sendButton.id = 'send-message';
        sendButton.textContent = 'Send';
        sendButton.style.cssText = `
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            border: none;
            color: #000000;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 12px;
        `;

        // Add input focus effects
        messageInput.addEventListener('focus', () => {
            messageInput.style.borderColor = '#00ff88';
        });
        messageInput.addEventListener('blur', () => {
            messageInput.style.borderColor = '#444444';
        });

        // Add button hover effects
        sendButton.addEventListener('mouseenter', () => {
            sendButton.style.transform = 'translateY(-2px)';
            sendButton.style.boxShadow = '0 5px 15px rgba(0, 255, 136, 0.4)';
        });
        sendButton.addEventListener('mouseleave', () => {
            sendButton.style.transform = 'translateY(0)';
            sendButton.style.boxShadow = 'none';
        });

        chatInput.appendChild(messageInput);
        chatInput.appendChild(sendButton);

        // Assemble chat window
        chatContainer.appendChild(chatHeader);
        chatContainer.appendChild(chatMessages);
        chatContainer.appendChild(chatInput);
        chatOverlay.appendChild(chatContainer);

        // Add to page
        document.body.appendChild(chatOverlay);

        // Add event listeners
        this.setupChatEventListeners(chatOverlay, messageInput, sendButton);

        // Focus on input
        setTimeout(() => messageInput.focus(), 100);
    }

    /**
     * Setup chat event listeners
     */
    setupChatEventListeners(chatOverlay, messageInput, sendButton) {
        // Close chat
        document.getElementById('close-chat').addEventListener('click', () => {
            chatOverlay.style.display = 'none';
        });

        // Close on overlay click
        chatOverlay.addEventListener('click', (e) => {
            if (e.target === chatOverlay) {
                chatOverlay.style.display = 'none';
            }
        });

        // Send message on button click
        sendButton.addEventListener('click', () => {
            this.sendChatMessage(messageInput);
        });

        // Send message on Enter (Shift+Enter for new line)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage(messageInput);
            }
        });

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chatOverlay.style.display === 'flex') {
                chatOverlay.style.display = 'none';
            }
        });
    }

    /**
     * Send chat message
     */
    async sendChatMessage(messageInput) {
        const message = messageInput.value.trim();
        if (!message) return;

        // Clear input
        messageInput.value = '';

        // Add user message to chat
        this.addChatMessage(message, 'user');

        // Show typing indicator
        document.getElementById('typing-indicator').style.display = 'block';

        // Scroll to bottom
        this.scrollChatToBottom();

        try {
            // Get comprehensive game context
            const gameContext = this.getComprehensiveGameContext();
            
            // Send to Claude API
            const response = await this.sendToClaudeAPI(message, gameContext);
            
            // Hide typing indicator
            document.getElementById('typing-indicator').style.display = 'none';
            
            // Add assistant response
            this.addChatMessage(response, 'assistant');
            
        } catch (error) {
            console.error('Chat error:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            
            // Hide typing indicator
            document.getElementById('typing-indicator').style.display = 'none';
            
            // Show error message with actual error details
            this.addChatMessage(`Sorry, I encountered an error: ${error.message}. Check console for details.`, 'assistant', true);
        }

        // Scroll to bottom
        this.scrollChatToBottom();
    }

    /**
     * Add message to chat
     */
    addChatMessage(content, sender, isError = false) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        const isUser = sender === 'user';
        const backgroundColor = isError ? '#ff6b6b' : (isUser ? '#3498db' : '#00ff88');
        const textColor = isError ? '#ffffff' : (isUser ? '#ffffff' : '#000000');
        const alignment = isUser ? 'flex-end' : 'flex-start';
        const borderRadius = isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px';
        
        messageDiv.style.cssText = `
            background: ${backgroundColor};
            color: ${textColor};
            padding: 15px 20px;
            border-radius: ${borderRadius};
            max-width: 80%;
            align-self: ${alignment};
            font-weight: ${isUser ? '500' : '600'};
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.4;
        `;
        
        messageDiv.textContent = content;
        
        // Insert before typing indicator
        const typingIndicator = document.getElementById('typing-indicator');
        chatMessages.insertBefore(messageDiv, typingIndicator);
    }

    /**
     * Scroll chat to bottom
     */
    scrollChatToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    /**
     * Get comprehensive game context for Claude
     */
    getComprehensiveGameContext() {
        const gameState = this.parser.getGameState();
        const currentAdvice = this.currentAdvice;
        
        const context = {
            // Current game state
            gameState: {
                isActive: gameState.isActive,
                isMyTurn: gameState.isMyTurn,
                holeCards: gameState.holeCards,
                boardCards: gameState.boardCards,
                potSize: gameState.potSize,
                toCall: gameState.toCall,
                stackSize: gameState.stackSize,
                positionName: gameState.positionName,
                street: gameState.street,
                activePlayers: gameState.activePlayers,
                facingBet: gameState.facingBet,
                opponentBets: gameState.opponentBets,
                bettingAction: gameState.bettingAction
            },
            
            // Blind levels
            blindLevels: this.blindLevels,
            
            // Current GTO advice (if available)
            gtoAdvice: currentAdvice ? {
                primaryAction: currentAdvice.primaryAction,
                strategy: currentAdvice.strategy,
                confidence: currentAdvice.confidence,
                reasoning: currentAdvice.reasoning,
                handStrength: currentAdvice.handStrength,
                handNotation: currentAdvice.handNotation,
                handType: currentAdvice.handType,
                bettingPurpose: currentAdvice.bettingPurpose,
                equity: currentAdvice.equity,
                potOdds: currentAdvice.potOdds,
                position: currentAdvice.position,
                stackDepthInfo: currentAdvice.stackDepthInfo
            } : null,
            
            // Session context
            sessionInfo: {
                timestamp: new Date().toISOString(),
                copilotVersion: '2.1',
                features: ['GTO Analysis', 'Mixed Strategies', 'Real-time Updates', 'Comprehensive Ranges']
            }
        };
        
        return context;
    }

    /**
     * Send message to Claude API via background script
     */
    async sendToClaudeAPI(userMessage, gameContext) {
        const apiKey = this.getClaudeAPIKey();
        if (!apiKey) {
            throw new Error('Claude API key not configured. Please add your Anthropic API key in the settings.');
        }

        console.log('🤖 UI: Sending request to background script...');
        console.log('User message:', userMessage);
        
        // Send request to background script to handle the API call
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'callClaudeAPI',
                data: {
                    userMessage,
                    gameContext,
                    apiKey
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                    reject(new Error(`Extension error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (response.success) {
                    console.log('🤖 UI: Received response from background script');
                    resolve(response.data);
                } else {
                    console.error('🤖 UI: Background script error:', response.error);
                    reject(new Error(response.error));
                }
            });
        });
    }

    /**
     * Get Claude API key (you'll need to implement proper key management)
     */
    getClaudeAPIKey() {
        // Development API key - replace with proper key management in production
        return 'YOUR_CLAUDE_API_KEY_HERE';
    }

    /**
     * Open settings modal
     */
    openSettings() {
        // Check if settings modal already exists
        if (document.getElementById('settings-modal')) {
            document.getElementById('settings-modal').style.display = 'flex';
            return;
        }

        // Create settings overlay
        const settingsOverlay = document.createElement('div');
        settingsOverlay.id = 'settings-modal';
        settingsOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10003;
            backdrop-filter: blur(5px);
        `;

        // Create settings container
        const settingsContainer = document.createElement('div');
        settingsContainer.style.cssText = `
            width: 90%;
            max-width: 500px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 15px;
            border: 2px solid #00ff88;
            box-shadow: 0 20px 60px rgba(0, 255, 136, 0.3);
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        // Create settings header
        const settingsHeader = document.createElement('div');
        settingsHeader.style.cssText = `
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            color: #000000;
            padding: 20px;
            font-weight: 700;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        settingsHeader.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="margin-right: 10px;">⚙️</span>
                <span>Settings</span>
            </div>
            <button id="close-settings" style="background: none; border: none; color: #000000; font-size: 24px; cursor: pointer; padding: 5px;">×</button>
        `;

        // Create settings content
        const settingsContent = document.createElement('div');
        settingsContent.style.cssText = `
            padding: 30px;
            background: #1a1a1a;
            color: #ffffff;
        `;

        const currentApiKey = localStorage.getItem('claude_api_key') || '';
        settingsContent.innerHTML = `
            <div style="margin-bottom: 25px;">
                <h3 style="color: #00ff88; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Claude API Configuration</h3>
                <p style="color: #cccccc; font-size: 12px; line-height: 1.5; margin-bottom: 15px;">
                    To use the chat assistant, you need an Anthropic Claude API key. Get yours from 
                    <a href="https://console.anthropic.com/" target="_blank" style="color: #00ff88;">console.anthropic.com</a>
                </p>
                
                <label style="display: block; color: #ffffff; font-weight: 600; margin-bottom: 8px; font-size: 12px;">
                    API Key:
                </label>
                <input type="password" id="api-key-input" placeholder="sk-ant-..." value="${currentApiKey}" style="
                    width: 100%;
                    background: #2d2d2d;
                    border: 2px solid #444444;
                    border-radius: 8px;
                    color: #ffffff;
                    padding: 12px;
                    font-size: 12px;
                    font-family: monospace;
                    transition: border-color 0.3s ease;
                    box-sizing: border-box;
                ">
                
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button id="save-api-key" style="
                        background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
                        border: none;
                        color: #000000;
                        padding: 10px 20px;
                        border-radius: 6px;
                        font-weight: 700;
                        cursor: pointer;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    ">Save</button>
                    
                    <button id="test-api-key" style="
                        background: #3498db;
                        border: none;
                        color: #ffffff;
                        padding: 10px 20px;
                        border-radius: 6px;
                        font-weight: 700;
                        cursor: pointer;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    ">Test Connection</button>
                    
                    <button id="clear-api-key" style="
                        background: #e74c3c;
                        border: none;
                        color: #ffffff;
                        padding: 10px 20px;
                        border-radius: 6px;
                        font-weight: 700;
                        cursor: pointer;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    ">Clear</button>
                </div>
                
                <div id="api-status" style="
                    margin-top: 15px;
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    display: none;
                "></div>
            </div>
            
            <div style="border-top: 1px solid #444444; padding-top: 20px;">
                <h3 style="color: #00ff88; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Privacy & Security</h3>
                <p style="color: #cccccc; font-size: 11px; line-height: 1.4;">
                    • API key is stored locally in your browser<br>
                    • Game data is sent to Claude for analysis only<br>
                    • No data is stored on external servers<br>
                    • You can clear your API key anytime
                </p>
            </div>
        `;

        // Assemble settings modal
        settingsContainer.appendChild(settingsHeader);
        settingsContainer.appendChild(settingsContent);
        settingsOverlay.appendChild(settingsContainer);

        // Add to page
        document.body.appendChild(settingsOverlay);

        // Add event listeners
        this.setupSettingsEventListeners(settingsOverlay);

        // Focus on API key input
        setTimeout(() => {
            const apiKeyInput = document.getElementById('api-key-input');
            apiKeyInput.focus();
            
            // Add focus effects
            apiKeyInput.addEventListener('focus', () => {
                apiKeyInput.style.borderColor = '#00ff88';
            });
            apiKeyInput.addEventListener('blur', () => {
                apiKeyInput.style.borderColor = '#444444';
            });
        }, 100);
    }

    /**
     * Setup settings event listeners
     */
    setupSettingsEventListeners(settingsOverlay) {
        // Close settings
        document.getElementById('close-settings').addEventListener('click', () => {
            settingsOverlay.style.display = 'none';
        });

        // Close on overlay click
        settingsOverlay.addEventListener('click', (e) => {
            if (e.target === settingsOverlay) {
                settingsOverlay.style.display = 'none';
            }
        });

        // Save API key
        document.getElementById('save-api-key').addEventListener('click', () => {
            const apiKey = document.getElementById('api-key-input').value.trim();
            if (apiKey) {
                localStorage.setItem('claude_api_key', apiKey);
                this.showApiStatus('API key saved successfully!', 'success');
            } else {
                this.showApiStatus('Please enter a valid API key', 'error');
            }
        });

        // Test API key
        document.getElementById('test-api-key').addEventListener('click', async () => {
            const apiKey = document.getElementById('api-key-input').value.trim();
            if (!apiKey) {
                this.showApiStatus('Please enter an API key first', 'error');
                return;
            }

            this.showApiStatus('Testing connection...', 'info');
            
            try {
                // Test the API key with a simple request
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-sonnet-20240229',
                        max_tokens: 10,
                        messages: [{ role: 'user', content: 'Test' }]
                    })
                });

                if (response.ok) {
                    localStorage.setItem('claude_api_key', apiKey);
                    this.showApiStatus('✅ API key is valid and working!', 'success');
                } else {
                    const errorData = await response.json();
                    this.showApiStatus(`❌ API Error: ${errorData.error?.message || 'Invalid API key'}`, 'error');
                }
            } catch (error) {
                this.showApiStatus(`❌ Connection failed: ${error.message}`, 'error');
            }
        });

        // Clear API key
        document.getElementById('clear-api-key').addEventListener('click', () => {
            localStorage.removeItem('claude_api_key');
            document.getElementById('api-key-input').value = '';
            this.showApiStatus('API key cleared', 'info');
        });
    }

    /**
     * Show API status message
     */
    showApiStatus(message, type) {
        const statusDiv = document.getElementById('api-status');
        statusDiv.style.display = 'block';
        statusDiv.textContent = message;

        const colors = {
            success: { bg: 'rgba(0, 255, 136, 0.2)', border: '#00ff88', text: '#00ff88' },
            error: { bg: 'rgba(231, 76, 60, 0.2)', border: '#e74c3c', text: '#e74c3c' },
            info: { bg: 'rgba(52, 152, 219, 0.2)', border: '#3498db', text: '#3498db' }
        };

        const color = colors[type] || colors.info;
        statusDiv.style.background = color.bg;
        statusDiv.style.border = `1px solid ${color.border}`;
        statusDiv.style.color = color.text;

        // Auto-hide after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }

    function getUserDisplayName(user) {
    return `${user.firstName} ${user.lastName}`;
}

function applyDiscount(price, percent) {
    return +(price * (1 - percent / 100)).toFixed(2);
}

function generateInvoiceId() {
    return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function mergeSettings(defaults, overrides) {
    return Object.assign({}, defaults, overrides);
}

function flattenArray(arr) {
    return arr.reduce((acc, val) => acc.concat(val), []);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getWeekday(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

function formatPhoneNumber(number) {
    return number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

function parseQueryParams(query) {
    return Object.fromEntries(new URLSearchParams(query));
}

function mapValues(obj, fn) {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeText(text) {
    return text.normalize('NFKC').toLowerCase().trim();
}

function getFirstDefined(...args) {
    return args.find(x => x !== undefined && x !== null);
}

function getRange(min, max) {
    return Array.from({ length: max - min + 1 }, (_, i) => i + min);
}

function reverseLookup(map, value) {
    return Object.keys(map).find(k => map[k] === value);
}

function toSlug(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

function isPalindrome(str) {
    const s = str.replace(/\W/g, '').toLowerCase();
    return s === s.split('').reverse().join('');
}

function getMonthName(index) {
    return new Date(0, index).toLocaleString('en-US', { month: 'long' });
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

function generateMatrix(rows, cols, value = 0) {
    return Array.from({ length: rows }, () => Array(cols).fill(value));
}

function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}

function countOccurrences(arr) {
    return arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
}

function compactArray(arr) {
    return arr.filter(Boolean);
}

function pick(obj, keys) {
    return keys.reduce((acc, key) => {
        if (key in obj) acc[key] = obj[key];
        return acc;
    }, {});
}

function omit(obj, keys) {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}

function encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(str) {
    return decodeURIComponent(escape(atob(str)));
}

function isEven(n) {
    return n % 2 === 0;
}

function isOdd(n) {
    return n % 2 !== 0;
}

function zipArrays(a, b) {
    return a.map((val, i) => [val, b[i]]);
}

function rotateArray(arr, count) {
    return arr.slice(count).concat(arr.slice(0, count));
}

function xorEncrypt(text, key) {
    return text.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('');
}

function median(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode(arr) {
    const freq = {};
    let maxFreq = 0;
    let result = null;
    for (const val of arr) {
        freq[val] = (freq[val] || 0) + 1;
        if (freq[val] > maxFreq) {
            maxFreq = freq[val];
            result = val;
        }
    }
    return result;
}

function getRandomColor() {
    return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function wrapText(text, width) {
    const regex = new RegExp(`(.{1,${width}})(\\s|$)`, 'g');
    return text.match(regex).join('\n');
}

function getTimeDiff(t1, t2) {
    return Math.abs(new Date(t1) - new Date(t2));
}

function sumMatrix(matrix) {
    return matrix.flat().reduce((a, b) => a + b, 0);
}

function validateNumber(input) {
    return !isNaN(input) && isFinite(input);
}

function limitString(str, maxLength) {
    return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}

function parseCSV(str) {
    return str.split('\n').map(line => line.split(','));
}

function serializeToCSV(data) {
    return data.map(row => row.join(',')).join('\n');
}

function convertToCamelCase(str) {
    return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
}

function convertToSnakeCase(str) {
    return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

function convertToKebabCase(str) {
    return str.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
}

function sortByKey(arr, key) {
    return [...arr].sort((a, b) => (a[key] > b[key] ? 1 : -1));
}

function padNumber(num, size = 2) {
    return num.toString().padStart(size, '0');
}

function getUTCDate() {
    return new Date().toISOString().split('T')[0];
}

function mergeSortedArrays(a, b) {
    const result = [];
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
        result.push(a[i] < b[j] ? a[i++] : b[j++]);
    }
    return result.concat(a.slice(i), b.slice(j));
}

function binarySearch(arr, target) {
    let low = 0, high = arr.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Export for use in other modules
window.CopilotUI = CopilotUI; 
