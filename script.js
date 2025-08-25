// Logique JavaScript
const transactionForm = document.getElementById('transactionForm');
const transactionsTableBody = document.querySelector('#transactionsTable tbody');
const clearTransactionsBtn = document.getElementById('clearTransactionsBtn');

// Éléments pour le filtrage
const monthFilter = document.getElementById('monthFilter');
const yearFilter = document.getElementById('yearFilter');

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
    }
    populateYearFilter();
    renderTransactions();
    calculateTotals();
}

// Fonction pour générer les options d'années pour le filtre
function populateYearFilter() {
    yearFilter.innerHTML = '<option value="all">Toutes les années</option>';
    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Fonction pour rendre les transactions dans le tableau HTML en fonction des filtres
function renderTransactions() {
    transactionsTableBody.innerHTML = ''; // Effacer le contenu existant
    
    const selectedMonth = monthFilter.value;
    const selectedYear = yearFilter.value;

    const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const transactionMonth = transactionDate.getMonth() + 1; // getMonth() est de 0 à 11
        const transactionYear = transactionDate.getFullYear();

        const matchMonth = selectedMonth === 'all' || transactionMonth == selectedMonth;
        const matchYear = selectedYear === 'all' || transactionYear == selectedYear;

        return matchMonth && matchYear;
    });

    filteredTransactions.forEach((transaction, index) => {
        const fraisTraitementUnitaireJumia = parseFloat(document.getElementById('fraisTraitementUnitaireJumia').value) || 0;
        const tauxCommissionJumia = parseFloat(document.getElementById('tauxCommissionJumia').value) / 100 || 0;
        const budgetPublicitaireUnitaire = parseFloat(document.getElementById('budgetPublicitaireUnitaire').value) || 0;

        // Calculs par transaction pour l'affichage
        const caNet = (transaction.quantite * transaction.prixVenteUnitaire) - 
                      ((transaction.quantite * transaction.prixVenteUnitaire * tauxCommissionJumia) + 
                      (transaction.quantite * fraisTraitementUnitaireJumia));
        const publicite = transaction.quantite * budgetPublicitaireUnitaire;
        const tresorerie = (transaction.prixRevientUnitaire / 2 + transaction.prixRevientUnitaire) * transaction.quantite;

        // Nouvelle formule de profit
        const profit = caNet - (tresorerie + publicite);
        
        const row = document.createElement('tr');
        const formattedDate = new Date(transaction.date).toLocaleDateString('fr-FR');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.designation}</td>
            <td>${transaction.quantite}</td>
            <td>${Math.round(caNet).toLocaleString()} F</td>
            <td>${Math.round(publicite).toLocaleString()} F</td>
            <td>${Math.round(tresorerie).toLocaleString()} F</td>
            <td>${Math.round(profit).toLocaleString()} F</td>
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

    const selectedMonth = monthFilter.value;
    const selectedYear = yearFilter.value;

    const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const transactionMonth = transactionDate.getMonth() + 1;
        const transactionYear = transactionDate.getFullYear();

        const matchMonth = selectedMonth === 'all' || transactionMonth == selectedMonth;
        const matchYear = selectedYear === 'all' || transactionYear == selectedYear;

        return matchMonth && matchYear;
    });

    let totalCaBrut = 0;
    let totalPrixRevient = 0;
    let totalPublicite = 0;
    let totalTresorerie = 0;
    
    filteredTransactions.forEach(transaction => {
        totalCaBrut += transaction.quantite * transaction.prixVenteUnitaire;
        totalPrixRevient += transaction.quantite * transaction.prixRevientUnitaire;
        totalPublicite += transaction.quantite * budgetPublicitaireUnitaire;
        totalTresorerie += (transaction.prixRevientUnitaire / 2 + transaction.prixRevientUnitaire) * transaction.quantite;
    });

    const commissionTotale = totalCaBrut * tauxCommissionJumia;
    const fraisTraitementTotal = filteredTransactions.reduce((acc, t) => acc + (t.quantite * fraisTraitementUnitaireJumia), 0);
    const abonnementJumiaApplicable = (totalCaBrut >= 100000) ? fraisAbonnementJumia : 0;
    const fraisTotauxJumia = commissionTotale + fraisTraitementTotal + abonnementJumiaApplicable;
    
    const caNetTotal = totalCaBrut - fraisTotauxJumia;
    
    // Nouvelle formule pour le profit net total
    const profitNetTotal = caNetTotal - (totalTresorerie + totalPublicite);

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
            prixRevientUnitaire,
            date: new Date().toISOString()
        };
        transactions.push(newTransaction);
        saveTransactions();
        populateYearFilter();
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
        populateYearFilter();
        renderTransactions();
        calculateTotals();
    }
});

// Gérer le bouton "Effacer tout"
clearTransactionsBtn.addEventListener('click', function() {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les transactions ? Cette action est irréversible.')) {
        transactions = [];
        saveTransactions();
        populateYearFilter();
        renderTransactions();
        calculateTotals();
    }
});

// Écouteurs d'événements pour les filtres
monthFilter.addEventListener('change', () => {
    renderTransactions();
    calculateTotals();
});

yearFilter.addEventListener('change', () => {
    renderTransactions();
    calculateTotals();
});

// Gérer les écouteurs d'événements pour les paramètres généraux
const generalInputs = document.querySelectorAll('.section:first-child input');
generalInputs.forEach(input => input.addEventListener('input', () => {
    renderTransactions();
    calculateTotals();
}));

// Charger les transactions au démarrage
loadTransactions();
