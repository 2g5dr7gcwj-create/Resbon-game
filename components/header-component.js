class ResbonHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 50;
                    background: rgba(26, 26, 26, 0.95);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(220, 38, 38, 0.3);
                    padding: 12px 16px;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .logo {
                    width: 48px;
                    height: 48px;
                    background: #000;
                    border: 2px solid #dc2626;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 15px rgba(220, 38, 38, 0.5);
                }
                .logo-text {
                    color: #dc2626;
                    font-size: 20px;
                    font-weight: 900;
                    text-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
                }
                .brand-text h1 {
                    color: white;
                    margin: 0;
                    font-size: 20px;
                    font-weight: bold;
                }
                .brand-text p {
                    color: #dc2626;
                    margin: 0;
                    font-size: 12px;
                }
                .stats {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .profit-box {
                    text-align: left;
                }
                .profit-label {
                    color: #9ca3af;
                    font-size: 12px;
                    margin: 0;
                }
                .profit-value {
                    color: #2563eb;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0;
                    text-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
                }
                .icon-btn {
                    width: 40px;
                    height: 40px;
                    background: #1a1a1a;
                    border: 1px solid #2563eb;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #2563eb;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .icon-btn:hover {
                    background: rgba(37, 99, 235, 0.2);
                }
                @media (max-width: 640px) {
                    .profit-box {
                        display: none;
                    }
                }
            </style>
            
            <header>
                <div class="container">
                    <div class="brand">
                        <div class="logo">
                            <span class="logo-text">RS</span>
                        </div>
                        <div class="brand-text">
                            <h1>رسـبون عراق</h1>
                            <p>🏓 Resbon Arena</p>
                        </div>
                    </div>
                    
                    <div class="stats">
                        <div class="profit-box">
                            <p class="profit-label">الأرباح اليوم</p>
                            <p class="profit-value" id="header-profit">0 د.ع</p>
                        </div>
                        <button class="icon-btn" onclick="document.dispatchEvent(new CustomEvent('show-stats'))">
                            <i data-feather="pie-chart" style="width: 20px; height: 20px;"></i>
                        </button>
                    </div>
                </div>
            </header>
        `;
        
        // Update profit display
        const updateProfit = () => {
            const saved = localStorage.getItem('resbonData');
            if (saved) {
                const data = JSON.parse(saved);
                const profit = data.stats?.totalProfit || 0;
                const el = this.shadowRoot.getElementById('header-profit');
                if (el) el.textContent = profit.toLocaleString() + ' د.ع';
            }
        };
        
        updateProfit();
        setInterval(updateProfit, 5000);
    }
}

customElements.define('resbon-header', ResbonHeader);
