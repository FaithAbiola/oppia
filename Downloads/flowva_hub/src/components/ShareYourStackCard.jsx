import './ShareYourStackCard.css'

const ShareYourStackCard = ({ onShare }) => {
  return (
    <div className="share-stack-card">
      <div className="card-header">
        <div className="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
          </svg>
        </div>
        <div className="header-content">
          <div>
            <h3 className="card-title">Share Your Stack</h3>
            <p className="points-badge-text" style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>Earn +25 pts</p>
          </div>
        </div>
      </div>
      <div className="card-content">
        <div className="card-description-row">
          <p className="card-description">Share your tool stack</p>
          <button className="share-button" onClick={onShare}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
              <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareYourStackCard

