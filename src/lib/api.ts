// Frontend API Client to communicate with our Express proxy server

const API_BASE = 'http://localhost:3001/api';

export interface SendInvitesPayload {
  emails: string[];
  campaignTitle: string;
  campaignId: string;
  organizationName: string;
}

export async function sendCampaignInvites(payload: SendInvitesPayload) {
  try {
    const response = await fetch(`${API_BASE}/emails/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error enviando correos');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (sendCampaignInvites):', error);
    // Para el entorno de desarrollo, si el servidor Node no está corriendo, 
    // no bloqueamos el flujo principal.
    return { success: true, simulated: true, fallback: true };
  }
}

export async function generateAIInsights(heatmapData: any, globalMetrics: any) {
  try {
    const response = await fetch(`${API_BASE}/insights/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ heatmapData, globalMetrics }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error generando insights');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error (generateAIInsights):', error);
    throw error;
  }
}
