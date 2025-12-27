/**
 * ZGRED - Frontend Application
 * Generator Dokumentów NGO
 */

// State
let selectedDocType = 'references';
let selectedVolunteer = null;
let allVolunteers = [];

// DOM Elements
const docTypeButtons = document.querySelectorAll('.doc-type-btn');
const volunteerSearch = document.getElementById('volunteerSearch');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const volunteerInfo = document.getElementById('volunteerInfo');
const additionalInfo = document.getElementById('additionalInfo');
const additionalInfoHint = document.getElementById('additionalInfoHint');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const loadingOverlay = document.getElementById('loadingOverlay');
const volunteersModal = document.getElementById('volunteersModal');
const volunteersList = document.getElementById('volunteersList');
const modalSearch = document.getElementById('modalSearch');
const showAllVolunteers = document.getElementById('showAllVolunteers');
const showAllVolunteersTop = document.getElementById('showAllVolunteersTop');
const closeModal = document.getElementById('closeModal');

// Document type labels
const docTypeLabels = {
  references: 'Referencje',
  cert: 'Certyfikat',
  internship: 'Staż/Praktyki'
};

// Additional info hints
const docTypeHints = {
  references: 'Podaj informacje o projektach, zaangażowaniu w onboarding, osiągnięciach oraz cechach charakteru. Te informacje zostaną wykorzystane do wygenerowania tekstu referencji (8-10 zdań).',
  cert: 'Podaj dodatkowe informacje o wolontariuszu. Agent AI wygeneruje 2 profesjonalne zdania podsumowujące wkład i zaangażowanie.',
  internship: 'Podaj informacje o projektach, osiągnięciach oraz wymaganiach uczelni do porównania.'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadVolunteers();
  setupEventListeners();
  updateHint();
});

// Event Listeners
function setupEventListeners() {
  // Document type selection
  docTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      docTypeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDocType = btn.dataset.type;
      updateHint();
      updateGenerateButton();
    });
  });

  // Search
  searchBtn.addEventListener('click', searchVolunteers);
  volunteerSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchVolunteers();
  });
  volunteerSearch.addEventListener('input', () => {
    if (volunteerSearch.value.length >= 2) {
      searchVolunteers();
    } else {
      searchResults.classList.remove('show');
    }
  });

  // Generate button
  generateBtn.addEventListener('click', generateDocument);

  // Modal
  showAllVolunteers.addEventListener('click', openModal);
  showAllVolunteersTop.addEventListener('click', openModal);
  closeModal.addEventListener('click', closeModalHandler);
  volunteersModal.addEventListener('click', (e) => {
    if (e.target === volunteersModal) closeModalHandler();
  });
  modalSearch.addEventListener('input', filterVolunteersList);

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section')) {
      searchResults.classList.remove('show');
    }
  });
}

// Load all volunteers
async function loadVolunteers() {
  try {
    const response = await fetch('/api/volunteers');
    if (response.ok) {
      allVolunteers = await response.json();
    }
  } catch (error) {
    console.error('Failed to load volunteers:', error);
  }
}

// Search volunteers
async function searchVolunteers() {
  const query = volunteerSearch.value.trim();
  if (!query) return;

  try {
    const response = await fetch(`/api/volunteers/search?q=${encodeURIComponent(query)}`);
    if (response.ok) {
      const results = await response.json();
      displaySearchResults(results);
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Display search results
function displaySearchResults(results) {
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-result-item"><span class="name">Nie znaleziono wolontariuszy</span></div>';
  } else {
    searchResults.innerHTML = results.map(v => `
      <div class="search-result-item" data-id="${v.id}">
        <div class="name">${v.name}</div>
        <div class="team">${v.team || '-'}</div>
      </div>
    `).join('');

    // Add click handlers
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const volunteer = results.find(v => v.id === item.dataset.id);
        selectVolunteer(volunteer);
        searchResults.classList.remove('show');
      });
    });
  }
  searchResults.classList.add('show');
}

// Map role codes to readable names
function getRoleName(role) {
  const roleMap = {
    'wolontariat': 'Wolontariusz',
    'wolontariusz': 'Wolontariusz',
    'staz': 'Stażysta',
    'stazysta': 'Stażysta',
    'praktyki': 'Praktykant',
    'praktykant': 'Praktykant'
  };

  if (!role) return '-';

  const roleLower = role.toLowerCase().trim();
  return roleMap[roleLower] || role;
}

// Select a volunteer
function selectVolunteer(volunteer) {
  selectedVolunteer = volunteer;
  volunteerSearch.value = volunteer.name;

  // Update display
  document.getElementById('displayName').textContent = volunteer.name || '-';
  document.getElementById('displayRole').textContent = getRoleName(volunteer.role);
  document.getElementById('displayTeam').textContent = volunteer.team || '-';
  document.getElementById('displayStartDate').textContent = volunteer.startDate || '-';
  document.getElementById('displayEndDate').textContent = volunteer.endDate || '-';
  document.getElementById('displayStatus').textContent = volunteer.status || '-';
  document.getElementById('displayTasks').textContent = volunteer.mainTasks || '-';

  volunteerInfo.classList.remove('hidden');
  updateGenerateButton();
}

// Update hint based on document type
function updateHint() {
  additionalInfoHint.textContent = docTypeHints[selectedDocType];
}

// Update generate button state
function updateGenerateButton() {
  const canGenerate = selectedVolunteer !== null;
  generateBtn.disabled = !canGenerate;
}

// Generate document
async function generateDocument() {
  if (!selectedVolunteer) return;

  // For references, additional info is required
  if (selectedDocType === 'references' && !additionalInfo.value.trim()) {
    alert('Referencje wymagają dodatkowych informacji o wolontariuszu.');
    additionalInfo.focus();
    return;
  }

  loadingOverlay.classList.remove('hidden');
  resultSection.classList.add('hidden');

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task: selectedDocType,
        name: selectedVolunteer.firstName,
        surname: selectedVolunteer.surname,
        additionalInfo: additionalInfo.value.trim()
      })
    });

    const result = await response.json();

    if (result.success) {
      resultContent.innerHTML = `
        <div class="result-success">
          <p>✅ Dokument wygenerowany pomyślnie!</p>
          <p><strong>Typ:</strong> ${docTypeLabels[selectedDocType]}</p>
          <p><strong>Wolontariusz:</strong> ${selectedVolunteer.name}</p>
          <a href="/api/download/${encodeURIComponent(result.filename)}" class="download-link" target="_blank">
            📥 Pobierz PDF
          </a>
        </div>
      `;
    } else {
      resultContent.innerHTML = `
        <div class="result-error">
          <p>❌ Błąd generowania dokumentu</p>
          <p>${result.error || 'Nieznany błąd'}</p>
        </div>
      `;
    }

    resultSection.classList.remove('hidden');
  } catch (error) {
    resultContent.innerHTML = `
      <div class="result-error">
        <p>❌ Błąd połączenia z serwerem</p>
        <p>${error.message}</p>
      </div>
    `;
    resultSection.classList.remove('hidden');
  } finally {
    loadingOverlay.classList.add('hidden');
  }
}

// Open volunteers modal
function openModal() {
  renderVolunteersList(allVolunteers);
  volunteersModal.classList.remove('hidden');
}

// Close modal
function closeModalHandler() {
  volunteersModal.classList.add('hidden');
  modalSearch.value = '';
}

// Render volunteers list in modal
function renderVolunteersList(volunteers) {
  if (volunteers.length === 0) {
    volunteersList.innerHTML = '<p>Brak wolontariuszy w bazie danych.</p>';
    return;
  }

  volunteersList.innerHTML = volunteers.map(v => `
    <div class="volunteer-list-item" data-id="${v.id}">
      <div class="name">${v.name}</div>
      <div class="details">${v.team || '-'} | ${v.status || '-'}</div>
    </div>
  `).join('');

  // Add click handlers
  volunteersList.querySelectorAll('.volunteer-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const volunteer = allVolunteers.find(v => v.id === item.dataset.id);
      selectVolunteer(volunteer);
      closeModalHandler();
    });
  });
}

// Filter volunteers list
function filterVolunteersList() {
  const query = modalSearch.value.toLowerCase().trim();
  if (!query) {
    renderVolunteersList(allVolunteers);
    return;
  }

  const filtered = allVolunteers.filter(v =>
    v.name.toLowerCase().includes(query) ||
    (v.team && v.team.toLowerCase().includes(query))
  );
  renderVolunteersList(filtered);
}
