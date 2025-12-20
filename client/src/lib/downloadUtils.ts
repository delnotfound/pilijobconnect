/**
 * Utility function to download a base64 data URL as a file
 * @param dataUrl - Base64 encoded data URL (e.g., "data:image/jpeg;base64,...")
 * @param fileName - Name of the file to download (without extension)
 */
export function downloadBase64File(dataUrl: string, fileName: string) {
  try {
    // Parse the data URL
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    // Create blob and download
    const blob = new Blob([u8arr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Determine file extension based on MIME type
    let fileExtension = '.bin';
    if (mimeType.includes('image/jpeg')) fileExtension = '.jpg';
    else if (mimeType.includes('image/png')) fileExtension = '.png';
    else if (mimeType.includes('image/gif')) fileExtension = '.gif';
    else if (mimeType.includes('application/pdf')) fileExtension = '.pdf';
    else if (mimeType.includes('application/msword')) fileExtension = '.doc';
    else if (mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) fileExtension = '.docx';

    link.href = url;
    link.download = `${fileName}${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error downloading document:', err);
    throw new Error('Failed to download document');
  }
}
