
import { getUserId } from './userConfig.js';
// Event Listeners for File Upload and Drag-and-Drop

// Trigger file input dialog when upload icon is clicked
document.getElementById("upload-icon").addEventListener("click", function(event) {
    event.preventDefault();
    document.getElementById("file-input").click();
  });
  
  // Handle file selection from file input
  document.getElementById("file-input").addEventListener("change", handleFileSelect);
  
  // Handle drag-over effect to allow dropping
  document.getElementById("input-container").addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  });
  
  // Handle file drop into the input container
  document.getElementById("input-container").addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      console.log("File dropped:", file); // Debugging log
      processFile(file); // Process the file to display preview
    }
  });
  
  // File Handling Functions
  
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      console.log("File selected:", file); // Debugging log
      processFile(file); // Process the file to display preview
    } else {
      console.log("No file selected");
    }
  }
  
  const sendButton = document.getElementById("send-button");
  
  // Function to resize the image before converting it to base64
function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
  
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
  
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
  
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
  
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
  
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result); // Base64 string
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }, file.type);
      };
  
      img.onerror = reject;
    });
  }
  
  // Modified processFile function to include resizing
  async function processFile(file, userId) {
    if (file && file.type.startsWith("image/")) {
      try {
        const resizedBase64 = await resizeImage(file, 300, 300);
        const userId = getUserId();
  
        // Display the resized image in the preview container
        const imagePreview = document.getElementById("image-preview");
        const previewImage = document.getElementById("preview-image");
        previewImage.src = resizedBase64;
        imagePreview.style.display = "block";
  
        const sendButton = document.getElementById("send-button");
        sendButton.style.display = "flex";
  
        // Send the resized image to Voiceflow
        await sendImageToVoiceflow(resizedBase64, userId);
      } catch (error) {
        console.error("Error resizing image:", error);
      }
    } else {
      alert("Only image files are supported.");
    }
  }
  
  
  // Usage: Resize image before converting to base64
  document.getElementById("file-input").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    const base64 = await resizeImage(file, 300, 300); // Resize to 300x300 max
    console.log("Resized base64:", base64);
  });
  
  // Function to Clear the Image Preview
  
  function clearImagePreview() {
    console.log("Clearing image preview..."); // Debugging log
    const imagePreview = document.getElementById("image-preview");
    const previewImage = document.getElementById("preview-image");
  
    previewImage.src = ""; // Clear the image source
    imagePreview.style.display = "none"; // Hide the preview container
  }
  
  // Attach clearImagePreview to window if using modules
  window.clearImagePreview = clearImagePreview;
  
  async function sendImageToVoiceflow(base64ImageData, userId) {
    try {
      const response = await fetch(`https://general-runtime.voiceflow.com/state/user/${userId}/variables`, {
        method: 'PATCH',
        headers: {
          accept: 'application/json',
          versionID: 'production',
          'content-type': 'application/json',
          Authorization: 'VF.DM.6704fc2164e59b16e562f2fa.QuN1SiPca01zgeS6'
        },
        body: JSON.stringify({ BASE64_IMAGE_DATA: base64ImageData })
      });
  
      const data = await response.json();
      //console.log("Image data sent to Voiceflow:", data);
      //console.log("userid:", userId);
      return data;
    } catch (error) {
      console.error("Error sending image data to Voiceflow:", error);
    }
  }
  