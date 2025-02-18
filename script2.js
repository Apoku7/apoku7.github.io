const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');
const closeBtn = document.getElementById('closeBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeBtn = document.getElementById('volumeBtn');
const volumeSlider = document.getElementById('volumeSlider');
const eyeBtn = document.getElementById('eyeBtn');

let isHidden = false;
let currentAudio = null;
let currentIndex = 0;
const totalImages = 8; // Ajustez ce nombre selon le nombre total d'images
let isMuted = false;
let isTransitioning = false;

// Positions prédéfinies pour chaque image
// Le format est : [x, y, rotation]
// x et y sont en pourcentage de la largeur/hauteur de l'écran
// rotation est en degrés
const imagePositions = [
    [2, 2, -8, 25],     // Image 1 : En haut à gauche, 70% de taille
    [2, 55, -5, 30],     // Image 2 : En haut au milieu, 85% de taille
    [66, 2, 5, 27],   // Image 3 : En haut à droite, 60% de taille
    [30, 3, 0, 27],    // Image 4 : Au milieu à gauche, 75% de taille
    [20, 65, -5, 25],    // Image 5 : Au centre, 90% de taille
    [70, 55, 8, 30],     // Image 6 : Au milieu à droite, 65% de taille
    [65, 75, 6, 35],   // Image 7 : En bas à gauche, 80% de taille
    [45, 50, -2, 20],     // Image 8 : En bas au milieu, 70% de taille
    [75, 70, -7, 20],    // Image 9 : En bas à droite, 75% de taille
    [75, 35, 9, 20],     // Image 10 : Position supplémentaire, 85% de taille
];

// Créer la galerie avec les positions prédéfinies
async function createGallery() {
    for (let i = 1; i <= totalImages; i++) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        // Créer l'image
        const img = document.createElement('img');
        img.src = `images/image${i}.png`;
        img.alt = `Image ${i}`;
        img.dataset.index = i - 1;
        
        // Attendre que l'image soit chargée
        await new Promise((resolve) => {
            img.onload = () => {
                const position = imagePositions[i - 1];
                
                // Appliquer la position en pourcentage et la taille
                item.style.left = `${position[0]}%`;
                item.style.top = `${position[1]}%`;
                item.style.setProperty('--rotation', `${position[2]}deg`);
                item.style.width = `${position[3]}%`; // Ajouter la taille
                item.style.height = 'auto'; // Pour maintenir le ratio de l'image
                
                resolve();
            };
            img.onerror = resolve; // En cas d'erreur de chargement
        });
        
        item.style.animationDelay = `${i * 0.1}s`;
        
        item.appendChild(img);
        gallery.appendChild(item);
        
        item.addEventListener('click', () => openModal(i - 1));
    }
}

// Appeler la création de la galerie
createGallery();

// Gérer le fondu sonore
function fadeAudioOut(audio, duration = 500) {
    return new Promise(resolve => {
        if (!audio) {
            resolve();
            return;
        }
        const startVolume = audio.volume;
        const steps = 20;
        const volumeStep = startVolume / steps;
        const stepDuration = duration / steps;
        
        const fadeInterval = setInterval(() => {
            if (audio.volume > volumeStep) {
                audio.volume -= volumeStep;
            } else {
                audio.volume = 0;
                clearInterval(fadeInterval);
                audio.pause();
                resolve();
            }
        }, stepDuration);
    });
}

function fadeAudioIn(audio, targetVolume, duration = 500) {
    audio.volume = 0;
    audio.play();
    
    const steps = 20;
    const volumeStep = targetVolume / steps;
    const stepDuration = duration / steps;
    
    const fadeInterval = setInterval(() => {
        if (audio.volume < targetVolume - volumeStep) {
            audio.volume += volumeStep;
        } else {
            audio.volume = targetVolume;
            clearInterval(fadeInterval);
        }
    }, stepDuration);
}

function openModal(index) {
    if (isTransitioning) return;
    currentIndex = index;
    updateModalImage();
    modal.classList.add('active');
    gallery.classList.add('blurred');
    playAudio(index);
}

async function closeModal() {
    if (isTransitioning) return;
    isTransitioning = true;
    

    
    modal.classList.remove('active');
    gallery.classList.remove('blurred');
    await fadeAudioOut(currentAudio);
    currentAudio = null;
    setTimeout(() => {
        isTransitioning = false;
    }, 300);
}

function updateModalImage() {
    modalImage.classList.add('sliding');
    
    setTimeout(() => {
        modalImage.src = `images/image${currentIndex + 1}.png`;
        modalImage.alt = `Image ${currentIndex + 1}`;
        
        setTimeout(() => {
            modalImage.classList.remove('sliding');
        }, 50);
    }, 300);
}

async function playAudio(index) {
    const newAudio = new Audio(`audio/audio${index + 1}.mp3`);
    const targetVolume = volumeSlider.value;
    
    if (currentAudio) {
        await fadeAudioOut(currentAudio);
    }
    
    currentAudio = newAudio;
    fadeAudioIn(newAudio, targetVolume);
}

async function navigateGallery(direction) {
    if (isTransitioning) return;
    isTransitioning = true;
    
    currentIndex = (currentIndex + direction + totalImages) % totalImages;
    updateModalImage();
    await playAudio(currentIndex);
    
    setTimeout(() => {
        isTransitioning = false;
    }, 500);
}

// Event Listeners
closeBtn.addEventListener('click', closeModal);
prevBtn.addEventListener('click', () => navigateGallery(-1));
nextBtn.addEventListener('click', () => navigateGallery(1));

document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('active')) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') navigateGallery(-1);
        if (e.key === 'ArrowRight') navigateGallery(1);
    }
});

volumeBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    volumeBtn.textContent = isMuted ? '🔇' : '🔊';
    volumeSlider.value = isMuted ? 0 : 1;
    if (currentAudio) {
        currentAudio.volume = isMuted ? 0 : volumeSlider.value;
    }
});

volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;
    if (currentAudio) {
        currentAudio.volume = volume;
    }
    volumeBtn.textContent = volume === '0' ? '🔇' : '🔊';
    isMuted = volume === '0';
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

eyeBtn.addEventListener('click', () => {
    isHidden = !isHidden;
    if (isHidden) {
        gallery.classList.add('hidden');
        eyeBtn.classList.add('hidden');
        eyeBtn.textContent = '👁️‍🗨️';
    } else {
        gallery.classList.remove('hidden');
        eyeBtn.classList.remove('hidden');
        eyeBtn.textContent = '👁️';
    }
});


const tutorialOverlay = document.createElement('div');
tutorialOverlay.id = 'tutorialOverlay';
tutorialOverlay.classList.add('tutorial-overlay');
document.body.appendChild(tutorialOverlay);

const tutorialSteps = [
    {
        title: "Bienvenue sur la Galerie",
        text: "Cette galerie est un hommage à Chips. Chaque personne a écrit un petit message destiné à Chips et a choisi une musique pour l'accompagner",
        highlight: null
    },
    {
        title: "Contrôle du Son",
        text: "Utilisez ce bouton pour ajuster le volume ou couper le son. Chaque image a sa propre ambiance sonore !",
        highlight: () => document.querySelector('.volume-control')
    },
    {
        title: "Masquer la Galerie",
        text: "Ce bouton permet de masquer temporairement toutes les images.",
        highlight: () => document.getElementById('eyeBtn')
    },
    {
        title: "Avertissement Mobile",
        text: "Ce site fonctionne mieux sur ordinateur. L'expérience peut être limitée sur mobile.",
        highlight: null
    }
];

let currentTutorialStep = 0;

function createTutorialModal() {
    tutorialOverlay.innerHTML = `
        <div class="tutorial-modal">
            <h2 id="tutorialTitle"></h2>
            <p id="tutorialText"></p>
            <button id="tutorialNextBtn" class="tutorial-btn">Suivant</button>
        </div>
    `;
    
    const title = tutorialOverlay.querySelector('#tutorialTitle');
    const text = tutorialOverlay.querySelector('#tutorialText');
    const nextBtn = tutorialOverlay.querySelector('#tutorialNextBtn');
    
    function updateTutorial() {
        const step = tutorialSteps[currentTutorialStep];
        title.textContent = step.title;
        text.textContent = step.text;
        
        // Supprimer les anciennes surlignages
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.remove());
        
        // Ajouter un nouveau surlignage si nécessaire
        if (step.highlight) {
            const highlightEl = step.highlight();
            if (highlightEl) {
                const highlight = document.createElement('div');
                highlight.classList.add('tutorial-highlight');
                const rect = highlightEl.getBoundingClientRect();
                
                highlight.style.position = 'fixed';
                highlight.style.left = `${rect.left - 5}px`;
                highlight.style.top = `${rect.top - 5}px`;
                highlight.style.width = `${rect.width + 10}px`;
                highlight.style.height = `${rect.height + 10}px`;
                
                document.body.appendChild(highlight);
            }
        }
        
        // Bouton final
        nextBtn.textContent = currentTutorialStep === tutorialSteps.length - 1 ? 'Commencer' : 'Suivant';
    }
    
    function nextStep() {
        currentTutorialStep++;
        
        if (currentTutorialStep < tutorialSteps.length) {
            if (currentTutorialStep === tutorialSteps.length - 1 && window.innerWidth > 1024) {
                endTutorial();
                return;
            }
            updateTutorial();
        } else {
            endTutorial();
        }
    }
    
    function endTutorial() {
        tutorialOverlay.style.display = 'none';
        // Supprimer tous les surlignages
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.remove());
        localStorage.setItem('tutorialCompleted', 'true');
    }
    
    nextBtn.addEventListener('click', nextStep);
    updateTutorial();
}

// Démarrer le tutoriel au chargement si pas déjà vu
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('tutorialCompleted')) {
        createTutorialModal();
        tutorialOverlay.style.display = 'flex';
    }
});
