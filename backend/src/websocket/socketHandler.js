const jwt = require('jsonwebtoken');
const LoanApplication = require('../models/LoanApplication');
const { verifyLocation, verifyIDMatch } = require('../services/verificationService');

module.exports = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id} (User ID: ${socket.userId})`);

    // Join room for a specific loan application
    socket.on('join-application', async (applicationId) => {
      try {
        const application = await LoanApplication.findById(applicationId);
        if (!application) {
          socket.emit('error', { message: 'Application not found' });
          return;
        }

        // Check permissions
        if (application.applicant.toString() !== socket.userId && 
            socket.userRole !== 'officer' && 
            socket.userRole !== 'admin') {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        socket.join(`application:${applicationId}`);
        socket.emit('joined-application', { applicationId });
        
        // Send current verification status
        socket.emit('verification-status', {
          idVerification: application.verificationData.idVerification.verified,
          locationVerification: application.verificationData.locationVerification.verified,
          witnessVerification: application.verificationData.witnessVerification.verified,
          nameMatchVerification: application.verificationData.nameMatchVerification.verified
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle real-time photo capture
    socket.on('capture-photo', async (data) => {
      try {
        const { applicationId, imageData, location } = data;
        
        const application = await LoanApplication.findById(applicationId);
        if (!application) {
          socket.emit('error', { message: 'Application not found' });
          return;
        }

        // Update realtime photo
        application.verificationData.realtimePhoto = {
          image: imageData,
          timestamp: new Date(),
          location: location
        };

        await application.save();

        // Broadcast to all users in the application room
        io.to(`application:${applicationId}`).emit('photo-captured', {
          timestamp: new Date(),
          location: location
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle location verification
    socket.on('verify-location', async (data) => {
      try {
        const { applicationId, coordinates } = data;
        
        const application = await LoanApplication.findById(applicationId);
        if (!application) {
          socket.emit('error', { message: 'Application not found' });
          return;
        }

        // Verify location (implement your logic here)
        const verificationResult = await verifyLocation(coordinates, application);

        application.verificationData.locationVerification = {
          coordinates: coordinates,
          timestamp: new Date(),
          verified: verificationResult.verified
        };

        await application.save();

        io.to(`application:${applicationId}`).emit('location-verified', {
          verified: verificationResult.verified,
          message: verificationResult.message
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle witness verification
    socket.on('verify-witness', async (data) => {
      try {
        const { applicationId, witnessData } = data;
        
        const application = await LoanApplication.findById(applicationId);
        if (!application) {
          socket.emit('error', { message: 'Application not found' });
          return;
        }

        application.verificationData.witnessVerification = {
          witnessName: witnessData.name,
          witnessIdNumber: witnessData.idNumber,
          witnessSignature: witnessData.signature,
          witnessPhoto: witnessData.photo,
          verificationTimestamp: new Date(),
          verified: true // Assuming witness presence is verified in real-time
        };

        await application.save();

        io.to(`application:${applicationId}`).emit('witness-verified', {
          witnessName: witnessData.name,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle ID verification
    socket.on('verify-id', async (data) => {
      try {
        const { applicationId, idImages, verificationMethod } = data;
        
        const application = await LoanApplication.findById(applicationId);
        if (!application) {
          socket.emit('error', { message: 'Application not found' });
          return;
        }

        // Verify ID name matches mobile money name
        const nameMatchResult = await verifyIDMatch(
          application.personalInfo.fullName,
          application.mobileMoneyDetails.accountName
        );

        application.verificationData.idVerification = {
          idFrontImage: idImages.front,
          idBackImage: idImages.back,
          verificationMethod: verificationMethod,
          verified: nameMatchResult.match,
          matchScore: nameMatchResult.score
        };

        application.verificationData.nameMatchVerification = {
          idName: application.personalInfo.fullName,
          mobileMoneyName: application.mobileMoneyDetails.accountName,
          match: nameMatchResult.match,
          verified: true
        };

        await application.save();

        io.to(`application:${applicationId}`).emit('id-verified', {
          verified: nameMatchResult.match,
          matchScore: nameMatchResult.score,
          message: nameMatchResult.message
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle mobile money verification
    socket.on('verify-mobile-money', async (data) => {
      try {
        const { applicationId, provider, phoneNumber } = data;
        
        const application = await LoanApplication.findById(applicationId);
        if (!application) {
          socket.emit('error', { message: 'Application not found' });
          return;
        }

        // Verify mobile money account (simulated)
        // In production, integrate with mobile money provider APIs
        const verificationResult = await verifyMobileMoneyAccount(provider, phoneNumber);

        application.mobileMoneyDetails = {
          provider: provider,
          phoneNumber: phoneNumber,
          accountName: verificationResult.accountName,
          verified: verificationResult.verified
        };

        await application.save();

        io.to(`application:${applicationId}`).emit('mobile-money-verified', {
          provider: provider,
          verified: verificationResult.verified,
          accountName: verificationResult.accountName
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle officer joining for real-time monitoring
    socket.on('officer-join', (applicationId) => {
      socket.join(`officer:${applicationId}`);
      io.to(`application:${applicationId}`).emit('officer-connected', {
        officerId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle real-time chat
    socket.on('send-message', (data) => {
      const { applicationId, message, type } = data;
      io.to(`application:${applicationId}`).emit('new-message', {
        sender: socket.userId,
        message: message,
        type: type,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
