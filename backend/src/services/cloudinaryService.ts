import https from 'https';
import crypto from 'crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

/**
 * Upload a video buffer to Cloudinary using the REST API (no SDK needed).
 * Returns the secure_url of the uploaded video.
 */
export const uploadVideoToCloudinary = async (
  videoBuffer: Buffer,
  publicId: string
): Promise<{ url: string; duration: number; publicId: string }> => {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error('Cloudinary credentials not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = 'interview-recordings';

  // Build the signature string (params must be alphabetical)
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  // Build multipart form data manually
  const boundary = '----CloudinaryBoundary' + Date.now();
  const fields: Record<string, string> = {
    api_key: API_KEY,
    timestamp,
    signature,
    folder,
    public_id: publicId,
  };

  const parts: Buffer[] = [];

  // Add text fields
  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    ));
  }

  // Add file field
  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${publicId}.webm"\r\nContent-Type: video/webm\r\n\r\n`
  ));
  parts.push(videoBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/video/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300 || json.error) {
            reject(new Error(`Cloudinary upload failed (${res.statusCode || 'no status'}): ${json.error?.message || data}`));
          } else {
            resolve({
              url: json.secure_url || json.url,
              duration: Math.round(json.duration || 0),
              publicId: json.public_id || `${folder}/${publicId}`,
            });
          }
        } catch (e) {
          reject(new Error(`Failed to parse Cloudinary response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5 * 60 * 1000, () => {
      req.destroy(new Error('Cloudinary upload timed out'));
    });
    req.write(body);
    req.end();
  });
};

/**
 * Delete a video from Cloudinary by public_id
 */
export const deleteVideoFromCloudinary = async (publicId: string): Promise<void> => {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) return;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const postData = `public_id=${publicId}&timestamp=${timestamp}&api_key=${API_KEY}&signature=${signature}`;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/video/destroy`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve());
    });

    req.on('error', (err) => {
      console.error('Cloudinary delete error:', err);
      resolve(); // Don't fail if delete fails
    });

    req.write(postData);
    req.end();
  });
};
