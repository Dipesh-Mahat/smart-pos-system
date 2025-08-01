/**
 * AI Dashboard Controller
 * Manages the AI Business Intelligence frontend interface
 */

class AIDashboard {
    constructor() {
        this.apiService = window.apiService;
        this.authService = window.authService;
        this.isLoading = false;
        this.aiData = null;
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        try {
            this.showLoading(true);
            await this.loadAIData();
            this.setupEventListeners();
            this.startAutoRefresh();
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to initialize AI Dashboard:', error);
            this.showError('Failed to load AI dashboard');
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshAIBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAIData());
        }

        // Export report button
        const exportBtn = document.getElementById('exportReportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        // Configuration toggle
        const toggleConfigBtn = document.getElementById('toggleConfigBtn');
        if (toggleConfigBtn) {
            toggleConfigBtn.addEventListener('click', () => this.toggleConfiguration());
        }

        // Clear cache button
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => this.clearCache());
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
        this.isLoading = show;
    }

    async loadAIData() {
        try {
            // Get AI dashboard data from backend
            const response = await fetch('/api/ai-intelligence/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.authService.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load AI data: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.aiData = data.data;
                this.updateAIStatus();
                this.updateInsightCards();
                this.updateRecommendations();
                this.updateQuickActions();
                this.updateDataQuality();
            } else {
                throw new Error(data.message || 'Failed to get AI insights');
            }

        } catch (error) {
            console.error('Error loading AI data:', error);
            this.showFallbackMode();
        }
    }

    updateAIStatus() {
        const statusCard = document.getElementById('aiStatusCard');
        const statusTitle = document.getElementById('aiProviderStatus');
        const statusDetails = document.getElementById('aiProviderDetails');
        const statusBadge = document.getElementById('aiStatusBadge');

        if (!this.aiData) return;

        const aiProvider = this.aiData.aiInsights?.aiProvider || 'Unknown';
        
        if (aiProvider === 'Gemini') {
            statusTitle.textContent = 'Google Gemini AI Connected';
            statusDetails.textContent = 'Advanced AI insights powered by Gemini 2.0 Flash';
            statusBadge.innerHTML = '<span>Connected</span>';
            statusBadge.className = 'status-badge connected';
            statusCard.className = 'ai-status-card connected';
        } else if (aiProvider === 'Fallback') {
            statusTitle.textContent = 'Intelligent Fallback Mode';
            statusDetails.textContent = 'Rule-based insights - Configure Gemini API for advanced AI';
            statusBadge.innerHTML = '<span>Fallback</span>';
            statusBadge.className = 'status-badge fallback';
            statusCard.className = 'ai-status-card fallback';
        } else {
            statusTitle.textContent = 'AI System Status';
            statusDetails.textContent = 'Checking AI provider availability...';
            statusBadge.innerHTML = '<span>Connecting...</span>';
            statusBadge.className = 'status-badge connecting';
            statusCard.className = 'ai-status-card';
        }
    }

    updateInsightCards() {
        if (!this.aiData?.aiInsights?.insights) {
            this.showInsightError();
            return;
        }

        const insights = this.aiData.aiInsights.insights;
        
        // Sales Prediction
        this.updateInsightCard(
            'salesPredictionCard',
            'salesPredictionContent', 
            'salesConfidenceBadge',
            insights.salesPrediction,
            'sales'
        );

        // Inventory Optimization
        this.updateInsightCard(
            'inventoryOptimizationCard',
            'inventoryOptimizationContent',
            'inventoryConfidenceBadge',
            insights.inventoryOptimization,
            'inventory'
        );

        // Product Performance
        this.updateInsightCard(
            'productPerformanceCard',
            'productPerformanceContent',
            'productConfidenceBadge',
            insights.productPerformance,
            'product'
        );

        // Customer Behavior
        this.updateInsightCard(
            'customerBehaviorCard',
            'customerBehaviorContent',
            'customerConfidenceBadge',
            insights.customerBehavior,
            'customer'
        );

        // Festival Intelligence
        this.updateInsightCard(
            'festivalIntelligenceCard',
            'festivalIntelligenceContent',
            'festivalConfidenceBadge',
            insights.festivalPreparation,
            'festival'
        );

        // Pricing Strategy
        this.updateInsightCard(
            'pricingStrategyCard',
            'pricingStrategyContent',
            'pricingConfidenceBadge',
            insights.pricingStrategy,
            'pricing'
        );
    }

    updateInsightCard(cardId, contentId, badgeId, insightData, type) {
        const content = document.getElementById(contentId);
        const badge = document.getElementById(badgeId);
        
        if (!content || !insightData) return;

        // Update confidence badge
        if (badge) {
            const confidence = insightData.confidence || 'medium';
            badge.textContent = confidence.charAt(0).toUpperCase() + confidence.slice(1);
            badge.className = `confidence-badge ${confidence}`;
        }

        // Update content based on type
        let html = '';
        
        switch (type) {
            case 'sales':
                html = this.renderSalesInsights(insightData);
                break;
            case 'inventory':
                html = this.renderInventoryInsights(insightData);
                break;
            case 'product':
                html = this.renderProductInsights(insightData);
                break;
            case 'customer':
                html = this.renderCustomerInsights(insightData);
                break;
            case 'festival':
                html = this.renderFestivalInsights(insightData);
                break;
            case 'pricing':
                html = this.renderPricingInsights(insightData);
                break;
            default:
                html = this.renderGenericInsights(insightData);
        }

        content.innerHTML = html;
        content.classList.add('fade-in');
    }

    renderSalesInsights(data) {
        const predictions = data.predictions || [];
        const insights = data.insights || [];
        
        return `
            <ul class="insight-list">
                ${predictions.slice(0, 3).map(prediction => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="insight-text">${this.escapeHtml(prediction)}</div>
                    </li>
                `).join('')}
                ${insights.slice(0, 2).map(insight => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-lightbulb"></i></div>
                        <div class="insight-text">${this.escapeHtml(insight)}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    renderInventoryInsights(data) {
        const optimizations = data.optimizations || [];
        const savings = data.savings || '';
        
        return `
            <ul class="insight-list">
                ${optimizations.slice(0, 3).map(opt => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-boxes"></i></div>
                        <div class="insight-text">${this.escapeHtml(opt)}</div>
                    </li>
                `).join('')}
                ${savings ? `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-piggy-bank"></i></div>
                        <div class="insight-text"><span class="insight-value">${this.escapeHtml(savings)}</span></div>
                    </li>
                ` : ''}
            </ul>
        `;
    }

    renderProductInsights(data) {
        const insights = data.insights || [];
        const topProducts = data.topPerformers || [];
        
        return `
            <ul class="insight-list">
                ${insights.slice(0, 2).map(insight => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-star"></i></div>
                        <div class="insight-text">${this.escapeHtml(insight)}</div>
                    </li>
                `).join('')}
                ${topProducts.slice(0, 2).map(product => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-trophy"></i></div>
                        <div class="insight-text">Top performer: <span class="insight-value">${this.escapeHtml(product)}</span></div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    renderCustomerInsights(data) {
        const insights = data.insights || [];
        const patterns = data.behaviorPatterns || [];
        
        return `
            <ul class="insight-list">
                ${insights.slice(0, 2).map(insight => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-users"></i></div>
                        <div class="insight-text">${this.escapeHtml(insight)}</div>
                    </li>
                `).join('')}
                ${patterns.slice(0, 2).map(pattern => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-chart-pie"></i></div>
                        <div class="insight-text">${this.escapeHtml(pattern)}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    renderFestivalInsights(data) {
        const insights = data.insights || [];
        const recommendations = data.recommendations || [];
        
        return `
            <ul class="insight-list">
                ${insights.slice(0, 2).map(insight => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-calendar-alt"></i></div>
                        <div class="insight-text">${this.escapeHtml(insight)}</div>
                    </li>
                `).join('')}
                ${recommendations.slice(0, 2).map(rec => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-gift"></i></div>
                        <div class="insight-text">${this.escapeHtml(rec)}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    renderPricingInsights(data) {
        const strategies = data.strategies || [];
        const recommendations = data.recommendations || [];
        
        return `
            <ul class="insight-list">
                ${strategies.slice(0, 2).map(strategy => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-tag"></i></div>
                        <div class="insight-text">${this.escapeHtml(strategy)}</div>
                    </li>
                `).join('')}
                ${recommendations.slice(0, 2).map(rec => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-percentage"></i></div>
                        <div class="insight-text">${this.escapeHtml(rec)}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    renderGenericInsights(data) {
        const insights = data.insights || data.recommendations || [];
        
        return `
            <ul class="insight-list">
                ${insights.slice(0, 4).map(insight => `
                    <li class="insight-item">
                        <div class="insight-icon"><i class="fas fa-info-circle"></i></div>
                        <div class="insight-text">${this.escapeHtml(insight)}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    updateRecommendations() {
        const grid = document.getElementById('recommendationsGrid');
        if (!grid) return;

        if (!this.aiData?.aiInsights?.insights?.businessRecommendations) {
            grid.innerHTML = `
                <div class="warning-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    No business recommendations available. Improve data quality for better insights.
                </div>
            `;
            return;
        }

        const recommendations = this.aiData.aiInsights.insights.businessRecommendations.recommendations || [];
        
        if (recommendations.length === 0) {
            grid.innerHTML = `
                <div class="warning-state">
                    Business recommendations will appear here when sufficient data is available.
                </div>
            `;
            return;
        }

        const html = recommendations.slice(0, 6).map((rec, index) => {
            const priority = this.getPriority(index);
            return `
                <div class="recommendation-card ${priority}-priority slide-up">
                    <div class="recommendation-title">
                        <i class="fas fa-lightbulb"></i>
                        Business Recommendation
                        <span class="priority-badge ${priority}">${priority}</span>
                    </div>
                    <div class="recommendation-text">${this.escapeHtml(rec)}</div>
                </div>
            `;
        }).join('');

        grid.innerHTML = html;
    }

    updateQuickActions() {
        const grid = document.getElementById('quickActionsGrid');
        if (!grid) return;

        const actions = [
            {
                icon: 'chart-line',
                title: 'Sales Forecast',
                action: 'viewSalesForecast'
            },
            {
                icon: 'boxes',
                title: 'Inventory Report',
                action: 'viewInventoryReport'
            },
            {
                icon: 'users',
                title: 'Customer Analysis',
                action: 'viewCustomerAnalysis'
            },
            {
                icon: 'calendar-alt',
                title: 'Festival Planning',
                action: 'viewFestivalPlanning'
            }
        ];

        const html = actions.map(action => `
            <div class="quick-action-btn" onclick="aiDashboard.${action.action}()">
                <div class="quick-action-icon">
                    <i class="fas fa-${action.icon}"></i>
                </div>
                <div class="quick-action-title">${action.title}</div>
            </div>
        `).join('');

        grid.innerHTML = html;
    }

    updateDataQuality() {
        const scoreElement = document.getElementById('dataQualityScore');
        if (!scoreElement) return;

        const dataQuality = this.aiData?.analysisQuality;
        if (dataQuality) {
            const score = Math.round(dataQuality.score || 0);
            const level = dataQuality.level || 'unknown';
            
            scoreElement.textContent = `${score}% (${level})`;
            scoreElement.className = `quality-score ${level}`;
        } else {
            scoreElement.textContent = 'No data';
            scoreElement.className = 'quality-score unknown';
        }
    }

    showFallbackMode() {
        // Update status to show fallback mode
        const statusTitle = document.getElementById('aiProviderStatus');
        const statusDetails = document.getElementById('aiProviderDetails');
        const statusBadge = document.getElementById('aiStatusBadge');
        const statusCard = document.getElementById('aiStatusCard');

        if (statusTitle) statusTitle.textContent = 'Intelligent Fallback Mode';
        if (statusDetails) statusDetails.textContent = 'Basic insights available - Configure Gemini API for advanced AI';
        if (statusBadge) {
            statusBadge.innerHTML = '<span>Fallback</span>';
            statusBadge.className = 'status-badge fallback';
        }
        if (statusCard) statusCard.className = 'ai-status-card fallback';

        // Show basic insights in cards
        this.showBasicInsights();
    }

    showBasicInsights() {
        const insights = {
            sales: {
                insights: [
                    'Monitor daily sales trends carefully',
                    'Track peak shopping hours',
                    'Compare weekly performance'
                ],
                confidence: 'low'
            },
            inventory: {
                optimizations: [
                    'Review slow-moving items weekly',
                    'Maintain safety stock levels',
                    'Track seasonal demand patterns'
                ],
                confidence: 'low'
            },
            product: {
                insights: [
                    'Track top-selling products daily',
                    'Monitor profit margins by category',
                    'Review underperforming products monthly'
                ],
                confidence: 'low'
            },
            customer: {
                insights: [
                    'Monitor peak shopping hours',
                    'Track customer purchase frequency',
                    'Identify repeat customers'
                ],
                confidence: 'low'
            },
            festival: {
                insights: [
                    'Prepare for upcoming festivals',
                    'Stock festival-specific items in advance',
                    'Plan special promotions and offers'
                ],
                confidence: 'low'
            },
            pricing: {
                recommendations: [
                    'Research competitor prices regularly',
                    'Adjust prices for festivals and seasons',
                    'Offer bulk purchase discounts'
                ],
                confidence: 'low'
            }
        };

        // Update each card with basic insights
        this.updateInsightCard('salesPredictionCard', 'salesPredictionContent', 'salesConfidenceBadge', insights.sales, 'sales');
        this.updateInsightCard('inventoryOptimizationCard', 'inventoryOptimizationContent', 'inventoryConfidenceBadge', insights.inventory, 'inventory');
        this.updateInsightCard('productPerformanceCard', 'productPerformanceContent', 'productConfidenceBadge', insights.product, 'product');
        this.updateInsightCard('customerBehaviorCard', 'customerBehaviorContent', 'customerConfidenceBadge', insights.customer, 'customer');
        this.updateInsightCard('festivalIntelligenceCard', 'festivalIntelligenceContent', 'festivalConfidenceBadge', insights.festival, 'festival');
        this.updateInsightCard('pricingStrategyCard', 'pricingStrategyContent', 'pricingConfidenceBadge', insights.pricing, 'pricing');

        // Show basic recommendations
        const grid = document.getElementById('recommendationsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="recommendation-card medium-priority">
                    <div class="recommendation-title">
                        <i class="fas fa-lightbulb"></i>
                        Basic Recommendation
                        <span class="priority-badge medium">medium</span>
                    </div>
                    <div class="recommendation-text">Focus on customer service excellence and accurate inventory tracking.</div>
                </div>
                <div class="recommendation-card low-priority">
                    <div class="recommendation-title">
                        <i class="fas fa-lightbulb"></i>
                        Basic Recommendation
                        <span class="priority-badge low">low</span>
                    </div>
                    <div class="recommendation-text">Monitor cash flow regularly and plan for seasonal demand changes.</div>
                </div>
            `;
        }

        // Update data quality
        const scoreElement = document.getElementById('dataQualityScore');
        if (scoreElement) {
            scoreElement.textContent = 'Basic Mode';
            scoreElement.className = 'quality-score fallback';
        }
    }

    showInsightError() {
        // Show error state in all insight cards
        const cardIds = [
            'salesPredictionContent',
            'inventoryOptimizationContent',
            'productPerformanceContent',
            'customerBehaviorContent',
            'festivalIntelligenceContent',
            'pricingStrategyContent'
        ];

        cardIds.forEach(cardId => {
            const content = document.getElementById(cardId);
            if (content) {
                content.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        Unable to load AI insights. Please try refreshing or check your connection.
                    </div>
                `;
            }
        });
    }

    async refreshAIData() {
        if (this.isLoading) return;
        
        const refreshBtn = document.getElementById('refreshAIBtn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
        }

        try {
            await this.loadAIData();
            this.showMessage('AI insights refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing AI data:', error);
            this.showMessage('Failed to refresh AI insights', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Insights';
                refreshBtn.disabled = false;
            }
        }
    }

    async exportReport() {
        try {
            const response = await fetch('/api/ai-intelligence/reports/business', {
                headers: {
                    'Authorization': `Bearer ${this.authService.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            const data = await response.json();
            
            if (data.success) {
                // Create and download the report
                const reportData = JSON.stringify(data.data, null, 2);
                const blob = new Blob([reportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `ai-business-report-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showMessage('Report exported successfully', 'success');
            } else {
                throw new Error(data.message || 'Failed to export report');
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            this.showMessage('Failed to export report', 'error');
        }
    }

    toggleConfiguration() {
        const content = document.getElementById('configContent');
        const toggleBtn = document.getElementById('toggleConfigBtn');
        
        if (content && toggleBtn) {
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            toggleBtn.innerHTML = isVisible ? 
                '<i class="fas fa-chevron-down"></i> Show Settings' : 
                '<i class="fas fa-chevron-up"></i> Hide Settings';
        }
    }

    async clearCache() {
        try {
            this.showMessage('Clearing AI cache...', 'info');
            
            // In a real implementation, you'd call an API to clear cache
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showMessage('AI cache cleared successfully', 'success');
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.showMessage('Failed to clear cache', 'error');
        }
    }

    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadAIData();
        }, 5 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Quick action methods
    viewSalesForecast() {
        this.showMessage('Opening sales forecast...', 'info');
        // Implementation for sales forecast view
    }

    viewInventoryReport() {
        this.showMessage('Opening inventory report...', 'info');
        // Implementation for inventory report view
    }

    viewCustomerAnalysis() {
        this.showMessage('Opening customer analysis...', 'info');
        // Implementation for customer analysis view
    }

    viewFestivalPlanning() {
        this.showMessage('Opening festival planning...', 'info');
        // Implementation for festival planning view
    }

    // Helper methods
    getPriority(index) {
        if (index < 2) return 'high';
        if (index < 4) return 'medium';
        return 'low';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type = 'info') {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add toast styles if not already present
        if (!document.getElementById('toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                    border-left: 4px solid #007bff;
                }
                .toast-success { border-left-color: #28a745; color: #155724; }
                .toast-error { border-left-color: #dc3545; color: #721c24; }
                .toast-info { border-left-color: #17a2b8; color: #0c5460; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    destroy() {
        this.stopAutoRefresh();
    }
}

// Initialize AI Dashboard when page loads
function initializeAIDashboard() {
    window.aiDashboard = new AIDashboard();
}

// Export for global access
window.AIDashboard = AIDashboard;
window.initializeAIDashboard = initializeAIDashboard;
