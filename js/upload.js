window.addScoreRow = function(eigen = '', tegen = '', doelman = false, goals = 0, assists = 0, rowTegenstander = '', rowLogo = '') {
    const wrapper = document.getElementById('mini-scores-wrapper');
    const row = document.createElement('div');
    row.className = 'score-row-item';
    row.style.width = "100%"; 
    
    const isToernooi = document.getElementById('type_wedstrijd') && document.getElementById('type_wedstrijd').value === 'Toernooi';
    const displayStyle = isToernooi ? 'block' : 'none';

    row.innerHTML = `
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
            
            <!-- Kop: Wedstrijd + Verwijderknop -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Uitslag</span>
                <button type="button" onclick="this.closest('.score-row-item').remove()" style="background: #fef2f2; color: #dc2626; border: none; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; cursor: pointer; transition: background 0.2s;">✕</button>
            </div>

            <!-- Tegenstander Veld (alleen voor Toernooi) -->
            <div class="row-tegenstander-container" style="display: ${displayStyle}; margin-bottom: 20px;">
                <label style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Tegenstander</label>
                <input type="text" class="row-tegenstander-input" placeholder="Typ ploegnaam..." value="${rowTegenstander}" data-logo="${rowLogo}" autocomplete="off" style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #e5e7eb; font-weight: 600; font-size: 14px; background: #f8fafc;">
            </div>

            <!-- Score Invoer (Premium Layout) -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <label style="font-size: 10px; font-weight: 800; color: #111827; display: block; margin-bottom: 6px; text-transform: uppercase; text-align: center;">Eigen Ploeg</label>
                    <input type="number" class="mini-score-eigen" min="0" value="${eigen}" required style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; font-size: 22px; font-weight: 800; color: #111827; background: #f8fafc;">
                </div>
                <div style="font-weight: 800; color: #94a3b8; font-size: 16px; margin-top: 18px;">-</div>
                <div style="flex: 1;">
                    <label style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; text-align: center;">Tegenstander</label>
                    <input type="number" class="mini-score-tegen" min="0" value="${tegen}" required style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; font-size: 22px; font-weight: 800; color: #111827; background: #f8fafc;">
                </div>
            </div>

            <!-- Persoonlijke Stats (Keeper, Goals, Assists) -->
            <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                
                <label style="display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
                    <input type="checkbox" class="mini-score-doelman" ${doelman ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #111827; cursor: pointer;"> 
                    Speelde als Keeper
                </label>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="font-size: 10px; font-weight: 700; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase;">Goals</label>
                        <input type="number" class="mini-score-goals" min="0" value="${goals}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; font-size: 16px; background: #fff;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 10px; font-weight: 700; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase;">Assists</label>
                        <input type="number" class="mini-score-assists" min="0" value="${assists}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; font-size: 16px; background: #fff;">
                    </div>
                </div>
            </div>
            
        </div>
    `;
    wrapper.appendChild(row);

    const rowInput = row.querySelector('.row-tegenstander-input');
    setupRowAutocomplete(rowInput);
};
