import { useNavigate } from "react-router-dom";
import "./user.css"; // Reusing theme styles

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="terms-page" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--white)' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: 'var(--bg-3)', color: 'var(--gold)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '32px' }}
      >
        ← Back to Registration
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', marginBottom: '12px' }}>Terms of Service</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Last Updated: April 22, 2026</p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>1. AI Legal Awareness Disclaimer</h2>
        <p style={{ lineHeight: '1.7', opacity: 0.8 }}>
          JurisBot is an Artificial Intelligence application designed for <strong>Legal Awareness and Information purposes only</strong>. 
          The information provided does not constitute professional legal advice, and no attorney-client relationship is created by your use of this platform.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>2. Limitation of Liability</h2>
        <p style={{ lineHeight: '1.7', opacity: 0.8 }}>
          The creators and operators of JurisBot shall not be held liable for any damages, legal complications, or financial losses 
          resulting from actions taken based on AI-generated responses. AI can occasionally produce inaccurate information regarding 
          statutes, case law, or procedures. <strong>Always verify critical information with a qualified legal professional.</strong>
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>3. User Responsibility</h2>
        <p style={{ lineHeight: '1.7', opacity: 0.8 }}>
          By using this service, you agree to provide accurate information and understand that the "Lawyer Consultation" feature connects you with 
          independent legal professionals. JurisBot does not guarantee the outcome of any legal matter discussed on the platform.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>4. Data Privacy</h2>
        <p style={{ lineHeight: '1.7', opacity: 0.8 }}>
          While we use industry-standard encryption, users are advised not to share highly sensitive or confidential identifying information 
          within the AI chat interface. Consultations with verified lawyers are protected by standard legal confidentiality protocols.
        </p>
      </section>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', marginTop: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
          By checking the box during registration, you confirm that you have read, understood, and agreed to these terms.
        </p>
      </div>
    </div>
  );
}
