// Global variables to store captured photos
const photos = [];
let currentPhotoIndex = 0;
let countdownInterval;
let cameraStream = null;

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const cameraContainer = document.getElementById('camera-container');
const photosPreview = document.getElementById('photos-preview');
const collageEditor = document.getElementById('collage-editor');
const cameraView = document.getElementById('camera-view');
const cameraCanvas = document.getElementById('camera-canvas');
const countdownElement = document.querySelector('.countdown');
const photoCounter = document.getElementById('current-photo');
const instruction = document.getElementById('instruction');
const flashElement = document.querySelector('.flash');

// Button Elements
const startButton = document.getElementById('start-button');
const cancelButton = document.getElementById('cancel-button');
const createCollageButton = document.getElementById('create-collage');
const retakePhotosButton = document.getElementById('retake-photos');
const printCollageButton = document.getElementById('print-collage');
const backToPhotosButton = document.getElementById('back-to-photos');

// Collage Customization Elements
const layoutStyle = document.getElementById('layout-style');
const frameStyle = document.getElementById('frame-style');
const photoFilter = document.getElementById('photo-filter');
const captionText = document.getElementById('caption-text');
const captionStyle = document.getElementById('caption-style');
const colorOptions = document.querySelectorAll('.color-option');


// Start button event listener
startButton.addEventListener('click', startPhotoSession);

// Cancel button event listener
cancelButton.addEventListener('click', () => {
    stopCamera();
    resetPhotoSession();
    showScreen(welcomeScreen);
});

// Create collage button event listener
createCollageButton.addEventListener('click', () => {
    generateCollage();
    showScreen(collageEditor);
});

// Retake photos button event listener
retakePhotosButton.addEventListener('click', () => {
    resetPhotoSession();
    startPhotoSession();
});

// Print collage button event listener
printCollageButton.addEventListener('click', () => {
    printCollage();
});

// Back to photos button event listener
backToPhotosButton.addEventListener('click', () => {
    showScreen(photosPreview);
});

// Layout style change event listener
layoutStyle.addEventListener('change', updateCollage);

// Frame style change event listener
frameStyle.addEventListener('change', updateCollage);

// Photo filter change event listener
photoFilter.addEventListener('change', updateCollage);

// Caption text input event listener
captionText.addEventListener('input', updateCollage);

// Caption style change event listener
captionStyle.addEventListener('change', updateCollage);

// Color options click event listeners
colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Remove selected class from all options
        colorOptions.forEach(opt => opt.classList.remove('ring-4', 'ring-indigo-400'));
        // Add selected class to clicked option
        option.classList.add('ring-4', 'ring-indigo-400');
        // Update collage with selected color
        updateCollage();
    });
});

// Function to start the photo session
function startPhotoSession() {
    showScreen(cameraContainer);
    startCamera()
    .then(() => {
        currentPhotoIndex = 0;
        photoCounter.textContent = currentPhotoIndex;
        instruction.textContent = "Get ready for your photos!";
        
        // Start the automatic photo capture process with a 3-second delay
        setTimeout(() => {
            startCountdown(3, () => {
                capturePhoto();
            });
        }, 2000);
    })
    .catch(error => {
        console.error('Error starting camera:', error);
        alert('Could not access camera. Please check your permissions and try again.');
        showScreen(welcomeScreen);
    });
}

// Function to start the camera
function startCamera() {
    const constraints = {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
        },
        audio: false
    };
    
    return navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        cameraStream = stream;
        cameraView.srcObject = stream;
        return new Promise(resolve => {
            cameraView.onloadedmetadata = () => {
                resolve();
            };
        });
    });
}

// Function to stop the camera
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
            track.stop();
        });
        cameraStream = null;
    }
}

// Function to start the countdown
function startCountdown(seconds, callback) {
    // Create audio elements for countdown and capture
    const tickSound = new Audio('sounds/tick.mp3');
    const captureSound = new Audio('sounds/camera-shutter.mp3');
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownElement.textContent = seconds;
    countdownElement.classList.remove('hidden');
    
    let remainingSeconds = seconds;
    
    // Play tick sound immediately for first number
    tickSound.play();
    
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownElement.classList.add('hidden');
            // Play capture sound
            captureSound.play();
            
            if (callback) {
                callback();
            }
        } else {
            countdownElement.textContent = remainingSeconds;
            // Play tick sound for each number
            tickSound.play();
        }
    }, 1000);
}

// Function to capture a photo
function capturePhoto() {
    // Show flash effect
    flashElement.classList.add('flash-active');
    setTimeout(() => {
        flashElement.classList.remove('flash-active');
    }, 500);
    
    // Set canvas dimensions to match video
    const width = cameraView.videoWidth;
    const height = cameraView.videoHeight;
    cameraCanvas.width = width;
    cameraCanvas.height = height;
    
    // Draw the current video frame to the canvas
    const context = cameraCanvas.getContext('2d');
    context.drawImage(cameraView, 0, 0, width, height);
    
    // Convert canvas to data URL and store it
    const photoData = cameraCanvas.toDataURL('image/png');
    photos[currentPhotoIndex] = photoData;
    
    // Update photo counter
    currentPhotoIndex++;
    photoCounter.textContent = currentPhotoIndex;
    
    // Update the preview image
    document.getElementById(`photo${currentPhotoIndex}`).src = photoData;
    
    // Check if we've taken all photos
    if (currentPhotoIndex >= 4) {
        // All photos taken, show preview
        stopCamera();
        showScreen(photosPreview);
    } else {
        // Start countdown for next photo
        instruction.textContent = `Get ready for photo ${currentPhotoIndex + 1}!`;
        
        // Wait 3 seconds before starting countdown for next photo
        setTimeout(() => {
            startCountdown(3, () => {
                capturePhoto();
            });
        }, 2000);
    }
}

// Function to reset the photo session
function resetPhotoSession() {
    photos.length = 0;
    currentPhotoIndex = 0;
    photoCounter.textContent = currentPhotoIndex;
    
    // Reset photo preview images
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`photo${i}`).src = "https://placehold.co/300x300";
    }
    
    // Clear countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownElement.classList.add('hidden');
    }
}

// Function to generate the collage
function generateCollage() {
    updateCollage();
}

// Function to update the collage based on current settings
function updateCollage() {
    const collageContainer = document.getElementById('collage-container');
    const layout = layoutStyle.value;
    const frame = frameStyle.value;
    const filter = photoFilter.value;
    const caption = captionText.value;
    const captionStyleValue = captionStyle.value;
    const captionFont = document.getElementById('caption-font').value;

    // Reset collage container classes
    collageContainer.className = 'collage-container p-8 rounded-lg';

    // Check if we're using a background image or color
    let selectedBgImage = '';
    let selectedColor = 'white';

    // Check for selected background image
    document.querySelectorAll('.bg-image-option').forEach(option => {
        if (option.classList.contains('ring-4')) {
            selectedBgImage = option.getAttribute('data-bg-image');
        }
    });

    // If no background image is selected, check for color
    if (!selectedBgImage) {
        document.querySelectorAll('.color-option').forEach(option => {
            if (option.classList.contains('ring-4')) {
                selectedColor = option.getAttribute('data-color');
            }
        });
    }

    // Apply background
    if (selectedBgImage) {
        // Apply background image
        collageContainer.style.backgroundImage = `url('backgrounds/${selectedBgImage}.jpeg')`;
        collageContainer.style.backgroundSize = 'cover';
        collageContainer.style.backgroundPosition = 'center';
        // Reset background color if we're using an image
        collageContainer.style.backgroundColor = '';
    } else {
        // Apply background color
        collageContainer.style.backgroundImage = '';
        switch(selectedColor) {
            case 'white':
                collageContainer.classList.add('bg-white');
                break;
            case 'black':
                collageContainer.classList.add('bg-black');
                break;
            case 'indigo':
                collageContainer.classList.add('bg-indigo-500');
                break;
            case 'pink':
                collageContainer.classList.add('bg-pink-500');
                break;
            case 'teal':
                collageContainer.classList.add('bg-teal-500');
                break;
            case 'yellow':
                collageContainer.classList.add('bg-yellow-400');
                break;
            case 'red':
                collageContainer.classList.add('bg-red-500');
                break;
            case 'green':
                collageContainer.classList.add('bg-green-500');
                break;
            case 'blue':
                collageContainer.classList.add('bg-blue-500');
                break;
            case 'purple':
                collageContainer.classList.add('bg-purple-500');
                break;
            default:
                collageContainer.classList.add('bg-white');
        }
    }
    // Clear previous collage
    collageContainer.innerHTML = '';

    // Caption text style class
    let captionClass = 'text-center my-4 ';
    
    // Apply caption style
    switch(captionStyleValue) {
        case 'classic':
            captionClass += 'text-xl';
            break;
        case 'bold':
            captionClass += 'text-xl font-bold';
            break;
        case 'playful':
            captionClass += 'text-xl text-indigo-400';
            break;
        case 'italic':
            captionClass += 'text-xl italic';
            break;
        default:
            captionClass += 'text-xl';
    }

    // Text color based on background
    if (['black', 'indigo', 'blue', 'purple', 'red', 'green', 'teal'].includes(selectedColor) && !selectedBgImage) {
        captionClass += ' text-white';
    } else {
        captionClass += ' text-gray-800';
    }

    // For dark background images, add text shadow for better readability
    if (selectedBgImage && ['abstract', 'vintage', 'nature'].includes(selectedBgImage)) {
        captionClass += ' text-white shadow-text';
    }

    // Frame class
    let frameClass = '';
    switch(frame) {
        case 'simple':
            frameClass = 'border-8 border-white';
            break;
        case 'shadow':
            frameClass = 'shadow-xl';
            break;
        case 'polaroid':
            frameClass = 'p-4 pb-12 bg-white shadow-lg';
            break;
        case 'vintage':
            frameClass = 'border-8 border-yellow-100 shadow-lg';
            break;
        default:
            frameClass = '';
    }

    // Filter class
    let filterClass = '';
    switch(filter) {
        case 'grayscale':
            filterClass = 'filter grayscale';
            break;
        case 'sepia':
            filterClass = 'filter sepia';
            break;
        case 'vintage':
            filterClass = 'filter sepia brightness-75 contrast-125';
            break;
        case 'bright':
            filterClass = 'filter brightness-125 contrast-110';
            break;
        case 'contrast':
            filterClass = 'filter contrast-150';
            break;
        default:
            filterClass = '';
    }

    // Create layout HTML
    let collageHTML = '';
    
    // Create layout
    switch(layout) {
        case 'grid':
            collageHTML = `
            <div class="grid grid-cols-2 gap-4">
                ${photos.map((photo, index) => `
                <div class="${frameClass} overflow-hidden">
                    <img src="${photo}" alt="Photo ${index + 1}" class="w-full h-auto ${filterClass}">
                </div>
                `).join('')}
            </div>
            `;
            break;
            
        case 'stack':
            collageHTML = `
            <div class="flex flex-col space-y-4">
                ${photos.map((photo, index) => `
                <div class="${frameClass} overflow-hidden">
                    <img src="${photo}" alt="Photo ${index + 1}" class="w-full h-auto ${filterClass}">
                </div>
                `).join('')}
            </div>
            `;
            break;
            
        case 'filmstrip':
            collageHTML = `
            <div class="flex space-x-4">
            ${photos.map((photo, index) => `
            <div class="${frameClass} overflow-hidden flex-grow">
                <img src="${photo}" alt="Photo ${index + 1}" class="w-full h-auto ${filterClass}">
            </div>
            `).join('')}
            </div>
            `;
            break;
            
        case 'polaroid':
            collageHTML = `
            <div class="grid grid-cols-2 gap-8 p-4">
                ${photos.map((photo, index) => `
                <div class="bg-white p-2 pb-12 shadow-xl transform rotate-${Math.floor(Math.random() * 6) - 3} transition-transform hover:rotate-0">
                    <img src="${photo}" alt="Photo ${index + 1}" class="w-full h-auto ${filterClass}">
                </div>
                `).join('')}
            </div>
            `;
            break;
            
        default:
            collageHTML = `
            <div class="grid grid-cols-2 gap-4">
                ${photos.map((photo, index) => `
                <div class="${frameClass} overflow-hidden">
                    <img src="${photo}" alt="Photo ${index + 1}" class="w-full h-auto ${filterClass}">
                </div>
                `).join('')}
            </div>
            `;
    }
    
    // Add caption if provided
    if (caption.trim() !== '') {
        collageHTML += `<div class="${captionClass}" style="font-family: ${captionFont};">${caption}</div>`;
    }
    
    // Set the collage HTML
    collageContainer.innerHTML = collageHTML;
}

// Add event listeners for background tabs
document.addEventListener('DOMContentLoaded', function() {
    const tabBgColor = document.getElementById('tab-bg-color');
    const tabBgImage = document.getElementById('tab-bg-image');
    const bgColorOptions = document.getElementById('bg-color-options');
    const bgImageOptions = document.getElementById('bg-image-options');
    
    // Tab switching
    tabBgColor.addEventListener('click', function() {
        tabBgColor.classList.add('border-b-2', 'border-indigo-500', 'text-indigo-600');
        tabBgImage.classList.remove('border-b-2', 'border-indigo-500', 'text-indigo-600');
        tabBgImage.classList.add('text-gray-500');
        
        bgColorOptions.classList.remove('hidden');
        bgImageOptions.classList.add('hidden');
    });
    
    tabBgImage.addEventListener('click', function() {
        tabBgImage.classList.add('border-b-2', 'border-indigo-500', 'text-indigo-600');
        tabBgColor.classList.remove('border-b-2', 'border-indigo-500', 'text-indigo-600');
        tabBgColor.classList.add('text-gray-500');
        
        bgImageOptions.classList.remove('hidden');
        bgColorOptions.classList.add('hidden');
    });
    
    // Handle background image selection
    document.querySelectorAll('.bg-image-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected state from all color options
            document.querySelectorAll('.color-option').forEach(colorOpt => {
                colorOpt.classList.remove('ring-4', 'ring-indigo-500');
            });
            
            // Remove selected state from all image options
            document.querySelectorAll('.bg-image-option').forEach(imgOpt => {
                imgOpt.classList.remove('ring-4', 'ring-indigo-500');
            });
            
            // Add selected state to this option
            this.classList.add('ring-4', 'ring-indigo-500');
            
            // Update collage
            updateCollage();
        });
    });
    
    // Handle color selection (existing code, just ensure it also clears image selection)
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected state from all image options
            document.querySelectorAll('.bg-image-option').forEach(imgOpt => {
                imgOpt.classList.remove('ring-4', 'ring-indigo-500');
            });
            
            // Remove selected state from all color options
            document.querySelectorAll('.color-option').forEach(colorOpt => {
                colorOpt.classList.remove('ring-4', 'ring-indigo-500');
            });
            
            // Add selected state to this option
            this.classList.add('ring-4', 'ring-indigo-500');
            
            // Update collage
            updateCollage();
        });
    });
});

// Add CSS for text shadow in the <head> section
const shadowTextStyle = document.createElement('style');
shadowTextStyle.textContent = `
.shadow-text {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}
`;
document.head.appendChild(shadowTextStyle);

function printCollage() {
    const collageContainer = document.getElementById("collage-container");
    
    // Show loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50";
    loadingIndicator.innerHTML = '<div class="bg-white p-4 rounded-lg shadow-lg">Generating image...</div>';
    document.body.appendChild(loadingIndicator);
    
    // Make sure to wait for all images to load
    Promise.all([
        // Create promises for all images in the collage
        ...Array.from(collageContainer.querySelectorAll('img')).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Resolve even on error to avoid hanging
            });
        })
    ]).then(function() {
        // Use dom-to-image to create the image
        domtoimage.toPng(collageContainer, { bgcolor: '#ffffff' })
            .then(function(dataUrl) {
                const link = document.createElement("a");
                const now = new Date();
                const dateString = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
                link.download = `photobooth-collage-${dateString}.png`;
                link.href = dataUrl;
                link.click();
                
                // Clean up
                document.body.removeChild(loadingIndicator);
            })
            .catch(function(error) {
                console.error("Error generating image with dom-to-image:", error);
                failureHandler();
            });
    }).catch(function(error) {
        console.error("Failed to load images:", error);
        document.body.removeChild(loadingIndicator);
        alert("Failed to generate collage. Please check that all images are loading correctly.");
    });

    // Handle failure in a centralized way
    function failureHandler() {
        alert("There was a problem generating your collage. Please try again or use a different browser.");
        document.body.removeChild(loadingIndicator);
    }
}

// Function to show a specific screen and hide others
function showScreen(screenToShow) {
    // Get all screen elements
    const screens = [welcomeScreen, cameraContainer, photosPreview, collageEditor];

    // Hide all screens
    screens.forEach(screen => screen.classList.add('hidden'));

    // Show the requested screen
    screenToShow.classList.remove('hidden');
}

// Select the first color option as default
const defaultColorOption = document.querySelectorAll('.color-option');
if (defaultColorOption.length > 0) {
    defaultColorOption[0].classList.add('ring-4', 'ring-indigo-400');
}

// Set up responsive behaviors for mobile devices
function setupResponsiveBehavior() {
    // Check if we're on a mobile device
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        // Adjust layout for mobile
        const layoutStyle = document.getElementById('layout-style');
        if (layoutStyle) {
            layoutStyle.value = 'stack';
        }
    }
}

// Run on page load
window.addEventListener('load', setupResponsiveBehavior);

// Run on window resize
window.addEventListener('resize', setupResponsiveBehavior);