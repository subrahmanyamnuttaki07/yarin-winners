const mockData = require('../data/mockData');

const getResourceRequests = (req, res) => {
  const requests = mockData.getResourceRequests();
  res.status(200).json(requests);
};

const createResourceRequest = (req, res) => {
  const { emergencyId, resourceType, quantity, reason, requestedBy } = req.body;

  if (!resourceType || !quantity || !reason) {
    return res.status(400).json({
      error: 'resourceType, quantity and reason are required.'
    });
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number.' });
  }

  const emergencies = mockData.getEmergencies();
  const emergency = emergencyId
    ? emergencies.find(e => e.id === emergencyId)
    : null;

  if (emergencyId && !emergency) {
    return res.status(404).json({ error: 'Emergency not found.' });
  }

  const requests = mockData.getResourceRequests();
  const newRequest = {
    id: `RR-${Date.now()}-${requests.length + 1}`,
    emergencyId: emergencyId || null,
    emergencyTitle: emergency?.title || null,
    resourceType,
    quantity: qty,
    reason,
    requestedBy: requestedBy || 'Operator',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null
  };

  requests.unshift(newRequest);
  mockData.setResourceRequests(requests);

  res.status(201).json({
    message: 'Resource request submitted to government.',
    request: newRequest
  });
};

const reviewResourceRequest = (req, res) => {
  const { id } = req.params;
  const { action, reviewedBy } = req.body;

  const normalizedAction = String(action || '').toUpperCase();

  if (!['ACCEPT', 'REJECT'].includes(normalizedAction)) {
    return res.status(400).json({
      error: 'Action must be ACCEPT or REJECT.'
    });
  }

  const requests = mockData.getResourceRequests();
  const request = requests.find(r => r.id === id);

  if (!request) {
    return res.status(404).json({
      error: 'Resource request not found.'
    });
  }

  if (request.status !== 'PENDING') {
    return res.status(409).json({
      error: `Request has already been ${request.status.toLowerCase()}.`,
      request
    });
  }

  // ============================================================
  // GOVERNMENT ACCEPTS RESOURCE REQUEST
  // ============================================================

  if (normalizedAction === 'ACCEPT') {
    const resources = mockData.getResources();

    const emergency = request.emergencyId
      ? mockData
          .getEmergencies()
          .find(e => e.id === request.emergencyId)
      : null;

    /*
      Map the request type to the resource type used by the system.
      "Boat" requests become "Rescue Boat" resources.
    */
    const resourceTypeMap = {
      "Ambulance": "Ambulance",
      "Rescue Team": "Rescue Team",
      "Boat": "Rescue Boat",
      "Medical Team": "Medical Team",
      "Helicopter": "Helicopter",
      "Relief Supplies": "Relief Supplies"
    };

    const newResourceType =
      resourceTypeMap[request.resourceType] || request.resourceType;

    /*
      Create the requested number of NEW government resources.
      These do NOT replace or modify the existing 7 resources.
    */
    const quantity = Number(request.quantity);

    const createdResources = [];

    for (let i = 1; i <= quantity; i++) {

      const newResource = {
        id: `GOV-${Date.now()}-${i}`,

        name: `Government ${newResourceType} ${i}`,

        type: newResourceType,

        status: "Available",

        capacity:
          newResourceType === "Ambulance"
            ? 4
            : newResourceType === "Medical Team"
            ? 12
            : newResourceType === "Rescue Team"
            ? 30
            : newResourceType === "Rescue Boat"
            ? 30
            : newResourceType === "Helicopter"
            ? 8
            : 20,

        speed:
          newResourceType === "Ambulance"
            ? 60
            : newResourceType === "Medical Team"
            ? 55
            : newResourceType === "Rescue Team"
            ? 45
            : newResourceType === "Rescue Boat"
            ? 32
            : newResourceType === "Helicopter"
            ? 220
            : 40,

        capabilities:
          newResourceType === "Ambulance"
            ? ["medical_evacuation", "triage"]
            : newResourceType === "Medical Team"
            ? ["first_aid", "field_medicine", "triage"]
            : newResourceType === "Rescue Team"
            ? ["debris_search", "heavy_lifting", "water_rescue"]
            : newResourceType === "Rescue Boat"
            ? ["water_rescue", "flood_evacuation"]
            : newResourceType === "Helicopter"
            ? ["air_rescue", "medical_evacuation"]
            : ["general_rescue"],

        /*
          Put newly supplied resources near the affected emergency
          when an emergency is associated with the request.
        */
        latitude: emergency?.latitude || 16.50,
        longitude: emergency?.longitude || 80.65,

        source: "Government",
        governmentRequestId: request.id,
        assignedEmergencyId: null,

        createdAt: new Date().toISOString()
      };

      resources.push(newResource);
      createdResources.push(newResource);
    }

    // Save the expanded resource pool
    mockData.setResources(resources);

    // Mark request as accepted
    request.status = "ACCEPTED";
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = reviewedBy || "Government";

    mockData.setResourceRequests(requests);

    return res.status(200).json({
      message: `${quantity} ${newResourceType} resource(s) added successfully.`,
      request,
      addedResources: createdResources
    });
  }

  // ============================================================
  // GOVERNMENT REJECTS RESOURCE REQUEST
  // ============================================================

  request.status = "REJECTED";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = reviewedBy || "Government";

  mockData.setResourceRequests(requests);

  return res.status(200).json({
    message: "Resource request rejected successfully.",
    request
  });
};

module.exports = {
  getResourceRequests,
  createResourceRequest,
  reviewResourceRequest
};
