import { useNavigate } from "react-router-dom";
import "./user.css"; // Reusing theme styles

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="terms-page" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--white)' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: 'var(--bg-3)', color: 'var(--gold)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '32px' }}
      >
        ← Back
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', marginBottom: '12px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Last Updated: August 31, 2026</p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>1. Data Collection & Usage</h2>
        <p style={{ lineHeight: '1.7', opacity: 0.8 }}>
          JurisBot collects only the information necessary to provide you with secure legal triage and mediation services. 
          This includes your email, phone number, and the documents you explicitly upload for AI analysis. We do not sell your personal data to third-party marketing agencies.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>2. AI Processing Confidentiality</h2>
        <p style={{ lineHeight: '1.7', opacity: 0.8 }}>
          Documents uploaded for AI triage are temporarily converted into encrypted vector embeddings. The original text is processed by our secure Large Language Models solely for the purpose of generating case heuristics. 
          <strong>We do not use your private legal documents to train our core AI models.</strong>
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>3. WebRTC Peer-to-Peer Security</h2>
        <p style={{ lineHeight: '1.7', opacity: 0.8 }}>
          All virtual mediations and video consultations between Citizens and Advocates utilize WebRTC Peer-to-Peer (P2P) technology. 
          This means your live video and audio streams are encrypted end-to-end and transmitted directly between participants. 
          <strong>JurisBot does not record, intercept, or store your video consultation data on our servers.</strong>
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>4. Data Retention & Deletion</h2>
        <p style={{ lineHeight: '1.7', opacity: 0.8 }}>
          You have the right to request the complete deletion of your account and associated documents at any time. Upon request, all vector embeddings, chat logs, and profile data will be permanently purged from our primary servers within 30 days.
        </p>
      </section>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', marginTop: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
          © 2026 JurisBot AI. All Rights Reserved. Protected by International Software Copyrights.
        </p>
      </div>
    </div>
  );
}
