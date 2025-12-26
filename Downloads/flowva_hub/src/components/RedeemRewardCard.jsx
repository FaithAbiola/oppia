import './RedeemRewardCard.css'

const RedeemRewardCard = ({ reward, userPoints, onClaim, isClaiming }) => {
  const canAfford = userPoints >= reward.points_required
  const isClaimed = reward.claimed || false
  const isComingSoon = reward.points_required === 0 || reward.coming_soon || false
  const isLocked = !canAfford && !isComingSoon && !isClaimed

  // Get emoji icon based on reward title or use default
  const getEmoji = () => {
    const title = reward.title?.toLowerCase() || ''
    if (title.includes('bank transfer') || title.includes('paypal')) return '💸'
    if (title.includes('visa') || title.includes('apple') || title.includes('google') || title.includes('amazon') || title.includes('gift card')) return '🎁'
    if (title.includes('udemy') || title.includes('course')) return '📚'
    return '🎁' // default
  }

  const handleClaim = () => {
    if (canAfford && !isClaimed && !isComingSoon && !isLocked && !isClaiming) {
      onClaim(reward)
    }
  }

  return (
    <div className={`redeem-reward-card ${isLocked ? 'locked' : ''} ${isComingSoon ? 'coming-soon' : ''}`}>
      <div className="reward-icon">
        {getEmoji()}
      </div>
      <h4 className="reward-title">{reward.title}</h4>
      <p className="reward-description">{reward.description || 'No description available.'}</p>
      <div className="reward-points">
        ⭐ {reward.points_required === 0 ? '0' : reward.points_required} pts
      </div>
      {isComingSoon ? (
        <button className="reward-button coming-soon-button" disabled>
          Coming Soon
        </button>
      ) : isLocked ? (
        <button className="reward-button locked-button" disabled>
          Locked
        </button>
      ) : isClaimed ? (
        <button className="reward-button claimed-button" disabled>
          Claimed
        </button>
      ) : (
        <button
          className="reward-button claim-button"
          onClick={handleClaim}
          disabled={isClaiming}
        >
          {isClaiming ? 'Claiming...' : 'Claim Reward'}
        </button>
      )}
    </div>
  )
}

export default RedeemRewardCard

