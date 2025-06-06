/**
 * PokerNow GTO Copilot - PokerNow-Specific Parser
 * Extracts game state information from PokerNow's exact HTML structure
 */

class PokerNowParser {
    constructor(pokerEngine) {
        this.engine = pokerEngine;
        this.gameState = {
            isActive: false,
            holeCards: [],
            boardCards: [],
            position: null,
            potSize: 0,
            toCall: 0,
            canRaise: true,
            activePlayers: 0,
            stackSize: 0,
            street: 'preflop',
            isMyTurn: false,
            lastUpdate: 0,
            // Enhanced game state
            playerBets: [], // All players' bets
            opponentBets: [], // Just opponent bets  
            dealerPosition: null,
            myPosition: null,
            positionName: null, // SB, BB, BTN, CO, etc.
            bettingAction: [], // Sequence of actions
            facingBet: 0, // Amount facing (different from toCall)
            potOdds: null,
            effectiveStack: 0
        };
        
        // PokerNow-specific selectors based on the provided HTML
        this.selectors = {
            // Player cards (hole cards)
            playerCards: '.table-player.you-player .table-player-cards',
            cardValue: '.card .value',
            cardSuit: '.card .suit:not(.sub-suit)',
            cardContainer: '.card-container',
            
            // Board cards
            boardCards: '.table-cards',
            
            // Pot and money
            potSize: '.table-pot-size .add-on .normal-value', // "total" pot
            mainPot: '.table-pot-size .main-value .normal-value', // main pot
            playerStack: '.table-player.you-player .table-player-stack .normal-value',
            betAmount: '.table-player-bet-value .normal-value',
            
            // Action buttons and turn detection
            actionButtons: '.action-buttons button.action-button',
            yourTurnSignal: '.action-signal:contains("Your Turn")',
            currentPlayer: '.table-player.decision-current.you-player',
            
            // Game info
            blinds: '.blind-value .normal-value',
            gameType: '.table-game-type'
        };
        
        this.lastGameLogLength = 0;
        this.observerActive = false;
        this.debugMode = false; // Disable debug mode to reduce interference and console spam
    }

    /**
     * Initialize the parser and start monitoring
     */
    initialize() {
        console.log('🎯 PokerNow Copilot: Initializing PokerNow-specific parser...');
        
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
        } else {
            this.startMonitoring();
        }
    }

    /**
     * Start monitoring PokerNow for game state changes
     */
    startMonitoring() {
        console.log('🎯 PokerNow Copilot: PokerNow parser active and monitoring...');
        
        // Set up mutation observer for real-time updates
        this.setupMutationObserver();
        
        // Do initial parse regardless of detection
        this.parseGameState();
        
        // Set up regular monitoring interval (every 2 seconds)
        setInterval(() => {
            this.parseGameState();
        }, 2000);
        
        // Also set up a more frequent check for game detection (every 5 seconds)
        setInterval(() => {
            if (!this.gameState.isActive) {
                console.log('🔍 Checking for new poker game...');
                this.parseGameState();
            }
        }, 5000);
        
        console.log('🎯 PokerNow monitoring started with aggressive detection');
    }

    /**
     * Set up mutation observer for real-time updates
     */
    setupMutationObserver() {
        if (this.observerActive) return;
        
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                // Check if relevant elements changed
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    const target = mutation.target;
                    
                    // Check if it's a card-related, pot-related, or action-related change
                    if (target.classList?.contains('table-player-cards') ||
                        target.classList?.contains('table-cards') ||
                        target.classList?.contains('table-pot-size') ||
                        target.classList?.contains('action-buttons') ||
                        target.classList?.contains('decision-current') ||
                        target.closest('.table-player-cards') ||
                        target.closest('.table-cards') ||
                        target.closest('.table-pot-size') ||
                        target.closest('.action-buttons')) {
                        shouldUpdate = true;
                    }
                }
            });
            
            if (shouldUpdate) {
                setTimeout(() => this.parseGameState(), 100); // Small delay to ensure DOM is updated
            }
        });
        
        // Observe the game container
        const gameContainer = document.querySelector('.game-main-container');
        if (gameContainer) {
            observer.observe(gameContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
            this.observerActive = true;
        }
    }

    /**
     * Debug method to show what elements are on the page
     */
    debugPageElements() {
        // Always run debug for first few times to help with troubleshooting
        if (!this.debugMode && this.parseCount > 3) return;
        
        console.log('🎯 PokerNow Parser Debug - Page Elements:', {
            url: window.location.href,
            title: document.title,
            bodyClass: document.body.className,
            
            // Count specific element types instead of selecting all
            tableElements: document.querySelectorAll('[class*="table"]').length,
            gameElements: document.querySelectorAll('[class*="game"]').length,
            cardElements: document.querySelectorAll('[class*="card"]').length,
            playerElements: document.querySelectorAll('[class*="player"]').length,
            buttonElements: document.querySelectorAll('button').length,
            
            // Safe sampling - only check body and main container classes
            bodyClasses: document.body.className,
            mainContainerClasses: document.querySelector('.game-main-container')?.className || 'not found',
                
            // Check for specific text content
            hasPokerTerms: {
                fold: document.body.textContent.includes('Fold'),
                call: document.body.textContent.includes('Call'),
                raise: document.body.textContent.includes('Raise'),
                allIn: document.body.textContent.includes('All-in'),
                check: document.body.textContent.includes('Check')
            }
        });
    }

    /**
     * Parse current game state from PokerNow DOM
     */
    parseGameState() {
        try {
            // Track parse count for debugging
            this.parseCount = (this.parseCount || 0) + 1;
            
            // Debug page elements first
            this.debugPageElements();
            
            const newGameState = {
                isActive: this.isGameActive(),
                holeCards: this.parseHoleCards(),
                boardCards: this.parseBoardCards(),
                position: this.parsePosition(),
                potSize: this.parsePotSize(),
                toCall: this.parseToCall(),
                canRaise: this.canRaise(),
                activePlayers: this.parseActivePlayers(),
                stackSize: this.parseStackSize(),
                street: this.parseStreet(),
                isMyTurn: this.isMyTurn(),
                lastUpdate: Date.now(),
                // Enhanced parsing
                playerBets: this.parseAllPlayerBets(),
                opponentBets: this.parseOpponentBets(),
                dealerPosition: this.parseDealerPosition(),
                myPosition: this.parseMyPosition(),
                positionName: this.parsePositionName(),
                bettingAction: this.parseBettingAction(),
                facingBet: this.parseFacingBet(),
                potOdds: this.calculatePotOdds(),
                effectiveStack: this.calculateEffectiveStack()
            };
            
            // Debug logging - always log for first few attempts
            if (this.debugMode || this.parseCount <= 5) {
                console.log('🎮 PokerNow parsed game state:', newGameState);
            }
            
            // Only update if something changed
            if (this.hasStateChanged(newGameState)) {
                this.gameState = newGameState;
                
                // Dispatch custom event for the copilot UI
                this.dispatchGameStateUpdate();
            }
            
        } catch (error) {
            console.error('PokerNow Parser error:', error);
        }
    }

    /**
     * Check if we're in an active poker game
     */
    isGameActive() {
        // More comprehensive PokerNow game detection
        const indicators = [
            // Try multiple possible selectors for PokerNow
            document.querySelector('.table'),
            document.querySelector('.game-main-container'),
            document.querySelector('.table-player'),
            document.querySelector('.action-buttons'),
            
            // Additional PokerNow selectors (broader search)
            document.querySelector('[class*="table"]'),
            document.querySelector('[class*="player"]'),
            document.querySelector('[class*="card"]'),
            document.querySelector('[class*="poker"]'),
            document.querySelector('[class*="game"]'),
            document.querySelector('[class*="pot"]'),
            document.querySelector('[class*="bet"]'),
            document.querySelector('[class*="action"]'),
            
            // Generic poker game indicators
            document.querySelector('[data-testid*="game"]'),
            document.querySelector('[data-testid*="table"]'),
            document.querySelector('[data-testid*="poker"]'),
            
            // Check for URLs that indicate we're in a game
            window.location.pathname.includes('/game'),
            window.location.pathname.includes('/table'),
            window.location.pathname.includes('/poker'),
            window.location.href.includes('poker'),
            
            // Check for common poker terms in page content
            document.body.textContent.includes('All-in'),
            document.body.textContent.includes('Fold'),
            document.body.textContent.includes('Call'),
            document.body.textContent.includes('Raise'),
            document.body.textContent.includes('Bet'),
            
            // Check for PokerNow specific elements
            document.querySelector('body[class*="poker"]'),
            document.querySelector('div[class*="game"]'),
            document.querySelector('div[class*="table"]')
        ];
        
        const foundIndicators = indicators.filter(indicator => indicator !== null && indicator !== false);
        const isActive = foundIndicators.length > 0;
        
        // Debug logging to see what we're finding
        if (this.debugMode || !isActive) {
            console.log('🎮 Game detection check:', {
                isActive,
                foundIndicators: foundIndicators.length,
                url: window.location.href,
                foundElements: foundIndicators.slice(0, 5), // Show first 5 found elements
                bodyClasses: document.body.className,
                // Safe class name sampling - only check specific containers
                gameContainerClasses: document.querySelector('[class*="game"]')?.className || 'none',
                tableContainerClasses: document.querySelector('[class*="table"]')?.className || 'none',
                playerContainerClasses: document.querySelector('[class*="player"]')?.className || 'none'
            });
        }
        
        return isActive;
    }

    /**
     * Parse hole cards from PokerNow structure
     */
    parseHoleCards() {
        const cards = [];
        
        // Find the player's cards container
        const playerCardsContainer = document.querySelector(this.selectors.playerCards);
        if (!playerCardsContainer) {
            if (this.debugMode) {
                console.log('🃏 No player cards container found');
            }
            return cards;
        }
        
        // Find all card containers
        const cardContainers = playerCardsContainer.querySelectorAll(this.selectors.cardContainer);
        
        cardContainers.forEach((container, index) => {
            // Only parse flipped cards (revealed to player)
            if (container.classList.contains('flipped')) {
                const cardElement = container.querySelector('.card');
                if (cardElement) {
                    const valueElement = cardElement.querySelector(this.selectors.cardValue);
                    const suitElement = cardElement.querySelector(this.selectors.cardSuit);
                    
                    if (valueElement && suitElement) {
                        const value = valueElement.textContent.trim();
                        const suit = suitElement.textContent.trim();
                        
                        // Convert PokerNow format to our format
                        const card = this.convertToStandardCard(value, suit);
                        if (card) {
                            cards.push(card);
                        }
                    }
                }
            }
        });
        
        if (this.debugMode && cards.length > 0) {
            console.log('🃏 Found hole cards:', cards);
        }
        
        return cards.slice(0, 2); // Limit to 2 hole cards
    }

    /**
     * Parse board cards (flop, turn, river)
     */
    parseBoardCards() {
        const cards = [];
        
        const boardContainer = document.querySelector(this.selectors.boardCards);
        if (!boardContainer) {
            return cards;
        }
        
        // Find all card containers on the board
        const cardContainers = boardContainer.querySelectorAll(this.selectors.cardContainer);
        
        cardContainers.forEach((container) => {
            // Only parse visible/flipped cards
            if (container.classList.contains('flipped')) {
                const cardElement = container.querySelector('.card');
                if (cardElement) {
                    const valueElement = cardElement.querySelector(this.selectors.cardValue);
                    const suitElement = cardElement.querySelector(this.selectors.cardSuit);
                    
                    if (valueElement && suitElement) {
                        const value = valueElement.textContent.trim();
                        const suit = suitElement.textContent.trim();
                        
                        const card = this.convertToStandardCard(value, suit);
                        if (card) {
                            cards.push(card);
                        }
                    }
                }
            }
        });
        
        if (this.debugMode && cards.length > 0) {
            console.log('🃏 Found board cards:', cards);
        }
        
        return cards.slice(0, 5); // Max 5 board cards
    }

    /**
     * Convert PokerNow card format to standard format
     */
    convertToStandardCard(value, suit) {
        // Map PokerNow values to standard values
        const valueMap = {
            'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': 'T',
            '10': 'T', '9': '9', '8': '8', '7': '7', '6': '6',
            '5': '5', '4': '4', '3': '3', '2': '2'
        };
        
        // Map PokerNow suits to standard suits
        const suitMap = {
            'd': 'd', 'h': 'h', 's': 's', 'c': 'c',
            '♦': 'd', '♥': 'h', '♠': 's', '♣': 'c'
        };
        
        const standardValue = valueMap[value];
        const standardSuit = suitMap[suit];
        
        if (standardValue && standardSuit) {
            const cardString = standardValue + standardSuit;
            return this.engine.parseCard(cardString);
        }
        
        return null;
    }

    /**
     * Parse pot size from PokerNow
     */
    parsePotSize() {
        // Try to get the total pot first
        let potElement = document.querySelector(this.selectors.potSize);
        
        // If no total pot, try main pot
        if (!potElement) {
            potElement = document.querySelector(this.selectors.mainPot);
        }
        
        if (potElement) {
            const potText = potElement.textContent.trim();
            return this.extractAmount(potText);
        }
        
        return 0;
    }

    /**
     * Parse amount to call from action buttons
     */
    parseToCall() {
        const actionButtons = document.querySelectorAll(this.selectors.actionButtons);
        
        for (const button of actionButtons) {
            const buttonText = button.textContent.toLowerCase();
            
            // Look for "Call X" pattern
            if (buttonText.includes('call')) {
                const match = buttonText.match(/call\s+(\d+)/i);
                if (match) {
                    return parseInt(match[1]);
                }
            }
        }
        
        return 0;
    }

    /**
     * Parse player's stack size
     */
    parseStackSize() {
        const stackElement = document.querySelector(this.selectors.playerStack);
        
        if (stackElement) {
            const stackText = stackElement.textContent.trim();
            return this.extractAmount(stackText);
        }
        
        return 100; // Default
    }

    /**
     * Check if it's the player's turn
     */
    isMyTurn() {
        // Check if player has decision-current class
        const currentPlayer = document.querySelector(this.selectors.currentPlayer);
        
        // Also check for "Your Turn" signal
        const turnSignalElements = document.querySelectorAll('.action-signal');
        const hasTurnSignal = Array.from(turnSignalElements).some(el => 
            el.textContent.includes('Your Turn')
        );
        
        return currentPlayer !== null || hasTurnSignal;
    }

    /**
     * Check if player can raise
     */
    canRaise() {
        const actionButtons = document.querySelectorAll(this.selectors.actionButtons);
        
        for (const button of actionButtons) {
            const buttonText = button.textContent.toLowerCase();
            if ((buttonText.includes('raise') || buttonText.includes('bet')) && !button.disabled) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Parse current street based on board cards
     */
    parseStreet() {
        const boardCards = this.parseBoardCards();
        
        if (boardCards.length === 0) return 'preflop';
        if (boardCards.length === 3) return 'flop';
        if (boardCards.length === 4) return 'turn';
        if (boardCards.length === 5) return 'river';
        
        return 'preflop';
    }

    /**
     * Parse player position (simplified)
     */
    parsePosition() {
        // Could be enhanced by looking at dealer button position
        // For now, default to BTN
        return 'BTN';
    }

    /**
     * Count active players
     */
    parseActivePlayers() {
        const players = document.querySelectorAll('.table-player');
        return Math.max(2, players.length);
    }

    /**
     * Extract monetary amount from text
     */
    extractAmount(text) {
        if (!text) return 0;
        
        // Remove currency symbols and extract numbers
        const cleanText = text.replace(/[$,]/g, '');
        const match = cleanText.match(/(\d+(?:\.\d{2})?)/);
        
        return match ? parseFloat(match[1]) : 0;
    }

    /**
     * Check if game state has changed
     */
    hasStateChanged(newState) {
        const currentState = this.gameState;
        
        return (
            newState.isActive !== currentState.isActive ||
            newState.holeCards.length !== currentState.holeCards.length ||
            newState.boardCards.length !== currentState.boardCards.length ||
            newState.potSize !== currentState.potSize ||
            newState.toCall !== currentState.toCall ||
            newState.isMyTurn !== currentState.isMyTurn ||
            newState.street !== currentState.street ||
            JSON.stringify(newState.holeCards) !== JSON.stringify(currentState.holeCards) ||
            JSON.stringify(newState.boardCards) !== JSON.stringify(currentState.boardCards)
        );
    }

    /**
     * Dispatch game state update event
     */
    dispatchGameStateUpdate() {
        const event = new CustomEvent('pokerGameStateUpdate', {
            detail: this.gameState
        });
        
        document.dispatchEvent(event);
        
        if (this.debugMode) {
            console.log('🎯 PokerNow game state updated:', this.gameState);
        }
    }

    /**
     * Get current game state
     */
    getGameState() {
        return { ...this.gameState };
    }

    /**
     * Force update game state
     */
    forceUpdate() {
        this.parseGameState();
    }

    enableDebugMode() {
        this.debugMode = true;
        console.log('🔧 PokerNow parser debug mode enabled');
    }

    disableDebugMode() {
        this.debugMode = false;
        console.log('🔧 PokerNow parser debug mode disabled');
    }

    // New methods for enhanced game state detection
    parseAllPlayerBets() {
        const playerBets = [];
        const allPlayers = document.querySelectorAll('.table-player');
        
        allPlayers.forEach((player, index) => {
            const betElement = player.querySelector('.table-player-bet-value .normal-value');
            const nameElement = player.querySelector('.table-player-name a');
            const stackElement = player.querySelector('.table-player-stack .normal-value');
            const isYou = player.classList.contains('you-player');
            const isDeciding = player.classList.contains('decision-current');
            
            const bet = betElement ? this.extractAmount(betElement.textContent) : 0;
            const stack = stackElement ? this.extractAmount(stackElement.textContent) : 0;
            const name = nameElement ? nameElement.textContent.trim() : `Player ${index + 1}`;
            
            playerBets.push({
                position: index + 1,
                name,
                bet,
                stack,
                isYou,
                isDeciding,
                element: player
            });
        });
        
        return playerBets;
    }

    parseOpponentBets() {
        const allBets = this.parseAllPlayerBets();
        return allBets.filter(player => !player.isYou);
    }

    parseDealerPosition() {
        const dealerButton = document.querySelector('[class*="dealer-position-"]');
        if (dealerButton) {
            const className = dealerButton.className;
            const match = className.match(/dealer-position-(\d+)/);
            return match ? parseInt(match[1]) : null;
        }
        return null;
    }

    parseMyPosition() {
        const youPlayer = document.querySelector('.table-player.you-player');
        if (youPlayer) {
            const className = youPlayer.className;
            const match = className.match(/table-player-(\d+)/);
            return match ? parseInt(match[1]) : null;
        }
        return null;
    }

    parsePositionName() {
        const dealerPos = this.parseDealerPosition();
        const myPos = this.parseMyPosition();
        const totalPlayers = this.parseActivePlayers();
        
        if (!dealerPos || !myPos) return 'Unknown';
        
        // Calculate position relative to dealer
        if (totalPlayers === 2) {
            // Heads-up: Button is Small Blind
            if (myPos === dealerPos) {
                return 'SB/BTN'; // Small Blind / Button
            } else {
                return 'BB'; // Big Blind
            }
        } else if (totalPlayers >= 3) {
            // Multi-way: Calculate position
            const seatDiff = (myPos - dealerPos + totalPlayers) % totalPlayers;
            
            if (seatDiff === 0) return 'BTN';
            if (seatDiff === 1) return 'SB';
            if (seatDiff === 2) return 'BB';
            if (seatDiff === 3) return 'UTG';
            if (seatDiff === 4) return 'UTG+1';
            if (seatDiff === 5) return 'MP';
            if (seatDiff === 6) return 'MP+1';
            if (seatDiff === 7) return 'HJ';
            if (seatDiff === 8) return 'CO';
            
            // For larger tables, generalize
            if (seatDiff <= totalPlayers / 2) return 'Early';
            if (seatDiff <= totalPlayers * 0.75) return 'Middle';
            return 'Late';
        }
        
        return 'Unknown';
    }

    parseBettingAction() {
        // This would ideally parse the game log, but for now return current state
        const allBets = this.parseAllPlayerBets();
        const actions = [];
        
        allBets.forEach(player => {
            if (player.bet > 0) {
                actions.push({
                    player: player.name,
                    position: player.position,
                    action: 'bet',
                    amount: player.bet,
                    isYou: player.isYou
                });
            }
        });
        
        return actions;
    }

    parseFacingBet() {
        const opponentBets = this.parseOpponentBets();
        const myBets = this.parseAllPlayerBets().filter(p => p.isYou);
        
        if (opponentBets.length === 0) return 0;
        
        const highestOpponentBet = Math.max(...opponentBets.map(p => p.bet));
        const myBet = myBets.length > 0 ? myBets[0].bet : 0;
        
        return Math.max(0, highestOpponentBet - myBet);
    }

    calculatePotOdds() {
        const potSize = this.parsePotSize();
        const facingBet = this.parseFacingBet();
        
        if (facingBet === 0) return null;
        
        const totalPot = potSize + facingBet;
        const odds = facingBet / totalPot;
        const percentage = (odds * 100).toFixed(1);
        
        return {
            ratio: `${facingBet}:${totalPot}`,
            percentage: parseFloat(percentage),
            description: `${percentage}% pot odds`
        };
    }

    calculateEffectiveStack() {
        const allBets = this.parseAllPlayerBets();
        const myStack = allBets.find(p => p.isYou)?.stack || 0;
        const opponentStacks = allBets.filter(p => !p.isYou).map(p => p.stack);
        
        if (opponentStacks.length === 0) return myStack;
        
        const smallestOpponentStack = Math.min(...opponentStacks);
        return Math.min(myStack, smallestOpponentStack);
    }
}

// Export for use in other modules
window.PokerNowParser = PokerNowParser; 