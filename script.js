// Logique JavaScript
const transactionForm = document.getElementById('transactionForm');
const transactionsTableBody = document.querySelector('#transactionsTable tbody');
const clearTransactionsBtn = document.getElementById('clearTransactionsBtn');

// Variables pour les résultats totaux
const caBrutTotalSpan = document.getElementById('caBrutTotal');
const caNetTotalSpan = document.getElementById('caNetTotal');
const profitNetTotalSpan = document.getElementById('profitNetTotal');

let transactions = [];

// Fonction pour sauvegarder les transactions dans le localStorage
function saveTransactions() {
    localStorage.setItem('jumiaFinancesTransactions', JSON.stringify(transactions));
}

// Fonction pour charger les transactions depuis le localStorage
function loadTransactions() {
    const savedTransactions = localStorage.getItem('jumiaFinancesTransactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
        renderTransactions();
        calculateTotals();
    }
}

// Fonction pour rendre les transactions dans le tableau HTML
function renderTransactions() {
    transactionsTableBody.innerHTML = ''; // Effacer le contenu existant
    
    transactions.forEach((transaction, index) => {
        // Paramètres généraux pour le calcul
        const fraisTraitementUnitaireJumia = parseFloat(document.getElementById('fraisTraitementUnitaireJumia').value) || 0;
        const tauxCommissionJumia = parseFloat(document.getElementById('tauxCommissionJumia').value) / 100 || 0;
        const budgetPublicitaireUnitaire = parseFloat(document.getElementById('budgetPublicitaireUnitaire').value) || 0;

        // Calculs par transaction
        const allocation = transaction.quantite * (transaction.prixRevientUnitaire / 2);
        const budget = transaction.quantite * budgetPublicitaireUnitaire;
        
        // Nouvelle formule pour la trésorerie basée sur votre définition
        const tresorerie = (transaction.prixRevientUnitaire / 2 + transaction.prixRevientUnitaire) * transaction.quantite;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.designation}</td>
            <td>${transaction.quantite}</td>
            <td>${Math.round(allocation).toLocaleString()} F</td>
            <td>${Math.round(budget).toLocaleString()} F</td>
            <td>${Math.round(tresorerie).toLocaleString()} F</td>
            <td><button class="delete-btn" data-index="${index}">Supprimer</button></td>
        `;
        transactionsTableBody.appendChild(row);
    });
}

// Fonction pour calculer les totaux globaux
function calculateTotals() {
    const fraisAbonnementJumia = parseFloat(document.getElementById('fraisAbonnementJumia').value) || 0;
    const fraisTraitementUnitaireJumia = parseFloat(document.getElementById('fraisTraitementUnitaireJumia').value) || 0;
    const tauxCommissionJumia = parseFloat(document.getElementById('tauxCommissionJumia').value) / 100 || 0;
    const budgetPublicitaireUnitaire = parseFloat(document.getElementById('budgetPublicitaireUnitaire').value) || 0;

    let totalCaBrut = 0;
    let totalPrixRevient = 0;
    
    transactions.forEach(transaction => {
        totalCaBrut += transaction.quantite * transaction.prixVenteUnitaire;
        totalPrixRevient += transaction.quantite * transaction.prixRevientUnitaire;
    });

    const commissionTotale = totalCaBrut * tauxCommissionJumia;
    const fraisTraitementTotal = transactions.reduce((acc, t) => acc + (t.quantite * fraisTraitementUnitaireJumia), 0);
    const abonnementJumiaApplicable = (totalCaBrut >= 100000) ? fraisAbonnementJumia : 0;
    const fraisTotauxJumia = commissionTotale + fraisTraitementTotal + abonnementJumiaApplicable;
    
    const caNetTotal = totalCaBrut - fraisTotauxJumia;
    const budgetTotal = transactions.reduce((acc, t) => acc + (t.quantite * budgetPublicitaireUnitaire), 0);
    
    const profitNetTotal = caNetTotal - totalPrixRevient - budgetTotal;

    // Affichage des résultats globaux
    caBrutTotalSpan.textContent = `${Math.round(totalCaBrut).toLocaleString()} F`;
    caNetTotalSpan.textContent = `${Math.round(caNetTotal).toLocaleString()} F`;
    profitNetTotalSpan.textContent = `${Math.round(profitNetTotal).toLocaleString()} F`;
    
    if (profitNetTotal < 0) {
        profitNetTotalSpan.classList.add('negative');
    } else {
        profitNetTotalSpan.classList.remove('negative');
    }
}

// Gérer la soumission du formulaire
transactionForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const designation = document.getElementById('designation').value;
    const quantite = parseFloat(document.getElementById('quantite').value);
    const prixVenteUnitaire = parseFloat(document.getElementById('prixVenteUnitaire').value);
    const prixRevientUnitaire = parseFloat(document.getElementById('prixRevientUnitaire').value);

    if (designation && !isNaN(quantite) && quantite > 0 && !isNaN(prixVenteUnitaire) && prixVenteUnitaire >= 0 && !isNaN(prixRevientUnitaire) && prixRevientUnitaire >= 0) {
        const newTransaction = {
            designation,
            quantite,
            prixVenteUnitaire,
            prixRevientUnitaire
        };
        transactions.push(newTransaction);
        saveTransactions();
        renderTransactions();
        calculateTotals();
        transactionForm.reset();
    }
});

// Gérer la suppression des transactions
transactionsTableBody.addEventListener('click', function(event) {
    if (event.target.classList.contains('delete-btn')) {
        const index = event.target.dataset.index;
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactions();
        calculateTotals();
    }
});

// Gérer le bouton "Effacer tout"
clearTransactionsBtn.addEventListener('click', function() {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les transactions ? Cette action est irréversible.')) {
        transactions = [];
        saveTransactions();
        renderTransactions();
        calculateTotals();
    }
});

// Gérer les écouteurs d'événements pour les paramètres généraux
const generalInputs = document.querySelectorAll('.section:first-child input');
generalInputs.forEach(input => input.addEventListener('input', () => {
    // Recalculer et afficher toutes les transactions et les totaux
    renderTransactions();
    calculateTotals();
}));

// Charger les transactions au démarrage
loadTransactions();