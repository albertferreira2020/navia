const markElements = async (page) => {
    return await page.evaluate(() => {
        document.querySelectorAll("[data-browser-use]").forEach((el) => {
            el.removeAttribute("data-browser-use");
            Object.assign(el.style, {
                outline: "", outlineOffset: "", boxShadow: "", transition: ""
            });
        });

        document.querySelectorAll(".browser-use-marker").forEach(marker => marker.remove());

        const selectors = [
            // Search inputs with higher priority
            'input[type="search"]', 'input[placeholder*="buscar"]', 'input[placeholder*="search"]',
            'input[placeholder*="pesquisar"]', 'input[name*="search"]', 'input[name*="busca"]',
            'input[id*="search"]', 'input[id*="busca"]', 'input[class*="search"]', 'input[class*="busca"]',
            // General inputs
            'input[type="text"]', 'input[type="email"]', 'input[type="password"]',
            'input[type="number"]', "input:not([type])", "textarea",
            // Interactive elements
            "select", "button", 'input[type="submit"]', 'input[type="button"]', "a[href]",
            '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]', '[role="option"]',
            // E-commerce specific
            ".product-item", ".product-card", ".search-box", ".btn", ".button",
            '[data-testid*="button"]', '[data-testid*="link"]', '[class*="button"]', '[class*="btn"]',
            // Mercado Livre specific
            '.nav-search-input', '.ui-search-input', '.cb-search-input'
        ];

        const isVisible = (el) => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);

            if (rect.width <= 10 || rect.height <= 10) return false;
            if (style.display === "none" || style.visibility === "hidden") return false;
            if (parseFloat(style.opacity) === 0) return false;

            return rect.top < window.innerHeight * 3 && rect.bottom > -100;
        };

        const isClickable = (el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return false;

            try {
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const elementAtPoint = document.elementFromPoint(centerX, centerY);

                return elementAtPoint === el || el.contains(elementAtPoint) ||
                    (elementAtPoint && elementAtPoint.contains(el));
            } catch {
                return true;
            }
        };

        const getScore = (el) => {
            const tagName = el.tagName.toLowerCase();
            const type = el.type?.toLowerCase() || "";
            const text = el.textContent?.toLowerCase() || "";
            const className = el.className?.toLowerCase() || "";
            const id = el.id?.toLowerCase() || "";
            const rect = el.getBoundingClientRect();

            const baseScores = {
                input: type === "search" ? 25 :
                    (text.includes("buscar") || text.includes("search") ||
                        className.includes("search") || className.includes("busca") ||
                        id.includes("search") || id.includes("busca")) ? 20 :
                        ["text", "email"].includes(type) ? 10 : 8,
                button: 12, select: 10, textarea: 8, a: 6
            };

            const keywords = [
                // Search-related keywords (higher priority)
                "busca", "search", "pesquisa", "buscar", "pesquisar", "procurar", "encontrar",
                // Filter and sort keywords
                "filtro", "filter", "ordenar", "sort", "organizar",
                // Commerce keywords
                "comprar", "buy", "carrinho", "cart", "produto", "product", "item", "preço", "price",
                // Account keywords
                "cadastrar", "login", "entrar", "register", "signup", "submit", "enviar",
                // Navigation keywords
                "menu", "link", "botão", "button"
            ];

            const highPrioritySearchKeywords = [
                "busca", "search", "pesquisa", "buscar", "pesquisar", "procurar"
            ];

            const negativeKeywords = [
                "nav", "menu", "header", "footer", "sidebar", "breadcrumb", "cookie", "popup",
                "modal", "overlay", "advertisement", "ad", "banner"
            ];

            let score = baseScores[tagName] || 3;
            const searchString = `${text} ${className} ${id}`;

            // Give extra points for high-priority search keywords
            const hasHighPrioritySearch = highPrioritySearchKeywords.some(keyword =>
                searchString.includes(keyword) ||
                (el.placeholder && el.placeholder.toLowerCase().includes(keyword))
            );
            if (hasHighPrioritySearch) {
                score += 15;
            }

            score += keywords.filter(keyword => searchString.includes(keyword)).length * 5;
            score -= negativeKeywords.filter(keyword => searchString.includes(keyword)).length * 10; if (rect.top >= 0 && rect.top <= window.innerHeight) {
                score += 20;
            } else if (rect.top > window.innerHeight && rect.top <= window.innerHeight * 2) {
                score += 10;
            } else if (rect.top < 0 && rect.bottom > 0) {
                score += 15;
            }

            return score;
        };

        const elements = Array.from(document.querySelectorAll(selectors.join(", ")))
            .filter(el => isVisible(el) && isClickable(el))
            .map((el) => ({
                element: el,
                score: getScore(el),
                data: {
                    tag: el.tagName.toLowerCase(),
                    type: el.type || null,
                    text: el.textContent.trim().slice(0, 100),
                    rect: el.getBoundingClientRect().toJSON(),
                    className: el.className,
                    id: el.id,
                    href: el.href || null
                }
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 30);

        const colors = {
            input: '#4CAF50', button: '#2196F3', a: '#FF9800', select: '#9C27B0', default: '#ff6b35'
        };

        return elements.map(({ element: el, data, score }, index) => {
            const id = `bu-${index}`;
            el.setAttribute("data-browser-use", id);

            const marker = document.createElement('div');
            marker.className = 'browser-use-marker';
            marker.textContent = index.toString();

            const color = colors[data.tag] || colors.default;
            marker.style.cssText = `
                position: absolute !important;
                top: -8px !important;
                left: -8px !important;
                background: ${color} !important;
                color: white !important;
                border-radius: 50% !important;
                width: 20px !important;
                height: 20px !important;
                font-size: 12px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-weight: bold !important;
                z-index: 10000 !important;
                border: 2px solid white !important;
            `;

            el.style.cssText += `outline: 2px solid ${color} !important; outline-offset: 2px !important;`;
            el.style.position = el.style.position || 'relative';
            el.appendChild(marker);

            return {
                id,
                tag: data.tag,
                type: data.type,
                text: data.text,
                rect: data.rect,
                className: data.className,
                originalId: data.id,
                href: data.href,
                relevanceScore: score
            };
        });
    });
};

export { markElements };
