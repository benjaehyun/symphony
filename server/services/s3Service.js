const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const s3Service = {
  async uploadPhoto(file, userId) {
    const key = `profiles/${userId}/${uuidv4()}.${file.mimetype.split('/')[1]}`;
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      
      // Construct the URL using the bucket and region
      const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
      return {
        url,
        key
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload to S3');
    }
  },

  async deletePhoto(key) {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    };

    try {
      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete from S3');
    }
  }
};

module.exports = s3Service;