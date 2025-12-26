import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './NotificationModal.css'

const NotificationModal = ({ isOpen, onClose = () => {}, onMarkAllAsRead, user }) => {
  const [openMenuId, setOpenMenuId] = useState(null)
  const [localNotifications, setLocalNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const menuRefs = useRef({})

  // Update time display every 30 seconds to trigger re-render for better UX
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (isOpen) {
      // Update immediately
      setCurrentTime(new Date())
      
      // Then update every 30 seconds
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isOpen])

  // Calculate relative time (e.g., "2 minutes ago", "1 hour ago")
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now'
    
    // Use currentTime state to ensure re-renders when time updates
    const now = currentTime
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`
  }

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user?.id) {
      console.log('fetchNotifications: No user ID, clearing notifications')
      setLocalNotifications([])
      setLoading(false)
      return
    }

    console.log('fetchNotifications: Starting fetch for user:', user.id)
    setLoading(true)
    try {
      // Check session first to ensure we're authenticated
      console.log('fetchNotifications: Verifying session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('No active session:', sessionError)
        setLocalNotifications([])
        setLoading(false)
        return
      }
      console.log('fetchNotifications: Session verified, user:', session.user.email)

      // Direct query - no count test, no order (sort in JS)
      console.log('fetchNotifications: Fetching notifications from database...')
      const queryStart = Date.now()
      
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('id, type, title, content, icon_bg, icon_color, created_at')
        .eq('user_id', user.id)
      
      const queryTime = Date.now() - queryStart
      console.log('fetchNotifications: Query completed in', queryTime, 'ms')
      
      // Sort in JavaScript
      const sortedData = notificationsData ? [...notificationsData].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ) : null

      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError)
        console.error('Error code:', notificationsError.code)
        console.error('Error message:', notificationsError.message)
        console.error('Error details:', JSON.stringify(notificationsError, null, 2))
        
        // Check if it's a permission error
        if (notificationsError.code === 'PGRST301' || notificationsError.message?.includes('permission') || notificationsError.message?.includes('policy')) {
          console.error('PERMISSION ERROR: Check your RLS policies for the notifications table!')
        }
        
        // Show empty list on error
        setLocalNotifications([])
        setLoading(false)
        return
      }

      console.log('fetchNotifications: Found', sortedData?.length || 0, 'notifications')
      console.log('fetchNotifications: Notifications data:', sortedData)
      
      // Use sorted data (rename to avoid conflict)
      const finalNotificationsData = sortedData || []

      // Fetch all read notification IDs for the user (optional - don't block if it fails)
      console.log('fetchNotifications: Fetching read status...')
      let readsData = null
      try {
        const { data: readsResult, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id)

        if (readsError) {
          console.warn('Error fetching read status (non-critical):', readsError)
        } else {
          readsData = readsResult
        }
      } catch (readsError) {
        console.warn('Exception fetching read status (non-critical):', readsError)
        // Continue without read status - all notifications will show as unread
      }

      const readNotificationIds = new Set(readsData?.map(r => r.notification_id) || [])

      // Combine notifications with read state
      const notificationsWithReadState = (finalNotificationsData || []).map(notif => ({
        id: notif.id,
        type: notif.type,
        message: {
          title: notif.title,
          content: notif.content
        },
        timestamp: notif.created_at,
        unread: !readNotificationIds.has(notif.id),
        iconBg: notif.icon_bg || 'rgb(231, 245, 231)',
        iconColor: notif.icon_color || 'rgb(45, 125, 50)'
      }))

      setLocalNotifications(notificationsWithReadState)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setLocalNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch notifications when modal opens or user changes
  useEffect(() => {
    console.log('NotificationModal useEffect - isOpen:', isOpen, 'user:', user?.email || 'none', 'user.id:', user?.id || 'none')
    if (isOpen && user) {
      fetchNotifications()
    } else if (!user) {
      console.log('NotificationModal: No user, clearing notifications')
      setLocalNotifications([])
    }
  }, [isOpen, user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId].contains(event.target)) {
          setOpenMenuId(null)
        }
      }
    }

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const handleMarkAsRead = async (notificationId) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notification_reads')
        .insert([{ user_id: user.id, notification_id: notificationId }])

      if (error) throw error

      // Update local state
      setLocalNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, unread: false } : notif
        )
      )

      if (onMarkAllAsRead) {
        onMarkAllAsRead()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleDelete = async (notificationId) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setLocalNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id || localNotifications.length === 0) return

    try {
      const unreadNotifications = localNotifications.filter(n => n.unread)
      if (unreadNotifications.length === 0) return

      const reads = unreadNotifications.map(notif => ({
        user_id: user.id,
        notification_id: notif.id
      }))

      const { error } = await supabase
        .from('notification_reads')
        .insert(reads)

      if (error) throw error

      // Update local state
      setLocalNotifications(prev =>
        prev.map(notif => ({ ...notif, unread: false }))
      )

      if (onMarkAllAsRead) {
        onMarkAllAsRead()
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDeleteAll = async () => {
    if (!user?.id || localNotifications.length === 0) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setLocalNotifications([])
    } catch (error) {
      console.error('Error deleting all notifications:', error)
    }
  }

  if (!isOpen) return null

  const displayNotifications = localNotifications
  const allRead = displayNotifications.every(n => !n.unread)

  const toggleMenu = (notificationId) => {
    setOpenMenuId(openMenuId === notificationId ? null : notificationId)
  }

  return (
    <>
      <div className="notification-overlay" onClick={onClose}></div>
      <div className="notification-popup active">
        <div className="notification-header">
          <div className="notification-title">Notifications</div>
          <div className="notification-actions">
            <button 
              className="notification-action" 
              onClick={handleMarkAllAsRead} 
              title="Mark all as read"
              disabled={allRead}
            >
              Mark all as read
            </button>
            <button className="notification-action" onClick={handleDeleteAll} title="Notification settings">
              Delete All
            </button>
          </div>
        </div>
        <div className="notification-body">
          {loading ? (
            <div className="notification-empty">
              <p>Loading notifications...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="notification-empty">
              <p>No notifications</p>
            </div>
          ) : (
            displayNotifications.map((notification) => (
              <div key={notification.id} className={`notification-item ${notification.unread ? 'unread' : ''}`}>
                <div className="notification-content">
                  <div 
                    className="notification-icon" 
                    style={{ 
                      backgroundColor: notification.iconBg || 'rgb(231, 245, 231)', 
                      color: notification.iconColor || 'rgb(45, 125, 50)' 
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smile">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                      <line x1="9" x2="9.01" y1="9" y2="9"></line>
                      <line x1="15" x2="15.01" y1="9" y2="9"></line>
                    </svg>
                  </div>
                  <div className="notification-info">
                    <div className="notification-message">
                      <strong>{notification.message?.title || notification.title}</strong>
                      <p className="truncate">
                        {notification.message?.content || notification.content}
                      </p>
                    </div>
                    <div className="notification-time">
                      {getRelativeTime(notification.timestamp || notification.created_at)}
                    </div>
                  </div>
                </div>
                <div className="notification-actions-item">
                  <button
                    className="notification-menu-button"
                    onClick={() => toggleMenu(notification.id)}
                    aria-label="Notification options"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>
                  {openMenuId === notification.id && (
                    <div className="notification-dropdown" ref={el => menuRefs.current[notification.id] = el}>
                      {notification.unread && (
                        <button
                          className="notification-dropdown-item"
                          onClick={() => {
                            handleMarkAsRead(notification.id)
                            setOpenMenuId(null)
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                          <span>Mark as read</span>
                        </button>
                      )}
                      <button
                        className="notification-dropdown-item"
                        onClick={() => {
                          handleDelete(notification.id)
                          setOpenMenuId(null)
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationModal