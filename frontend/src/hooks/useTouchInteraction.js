import { useCallback, useRef, useState, useEffect } from 'react'

const GESTURE_TYPES = {
  TAP: 'tap',
  DOUBLE_TAP: 'double_tap',
  LONG_PRESS: 'long_press',
  SWIPE: 'swipe',
  PINCH: 'pinch',
  PAN: 'pan',
}

const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
}

export const useTouchInteraction = ({
  onTap,
  onDoubleTap,
  onLongPress,
  onSwipe,
  onPinch,
  onPan,
  longPressDelay = 500,
  doubleTapDelay = 300,
  minSwipeDistance = 30,
  preventScroll = false,
} = {}) => {
  const [gesture, setGesture] = useState(null)
  const touchRef = useRef({
    startTime: 0,
    startX: 0,
    startY: 0,
    lastTap: 0,
    touchCount: 0,
    pinchStart: 0,
    longPressTimer: null,
    activePoints: new Map(),
  })

  // Debounced event handlers
  const debouncedHandlers = useRef({
    tap: debounce((x, y) => {
      onTap?.({ x, y })
    }, 100),
    doubleTap: debounce((x, y) => {
      onDoubleTap?.({ x, y })
    }, 100),
  })

  // Touch start handler
  const handleTouchStart = useCallback((e) => {
    if (preventScroll) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    const now = Date.now()
    const { current: t } = touchRef

    // Store touch points
    Array.from(e.touches).forEach(touch => {
      t.activePoints.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      })
    })

    t.startTime = now
    t.startX = touch.clientX
    t.startY = touch.clientY
    t.touchCount = e.touches.length

    // Handle potential long press
    clearTimeout(t.longPressTimer)
    t.longPressTimer = setTimeout(() => {
      if (t.activePoints.size === 1) {
        setGesture({ type: GESTURE_TYPES.LONG_PRESS, x: t.startX, y: t.startY })
        onLongPress?.({ x: t.startX, y: t.startY })
      }
    }, longPressDelay)

    // Handle potential pinch start
    if (e.touches.length === 2) {
      const p1 = e.touches[0]
      const p2 = e.touches[1]
      t.pinchStart = getPinchDistance(p1, p2)
    }
  }, [longPressDelay, onLongPress, preventScroll])

  // Touch move handler
  const handleTouchMove = useCallback((e) => {
    if (preventScroll) {
      e.preventDefault()
    }

    const { current: t } = touchRef
    const touch = e.touches[0]

    // Update active points
    Array.from(e.touches).forEach(touch => {
      t.activePoints.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      })
    })

    // Handle pinch
    if (e.touches.length === 2) {
      const p1 = e.touches[0]
      const p2 = e.touches[1]
      const currentDistance = getPinchDistance(p1, p2)
      const scale = currentDistance / t.pinchStart

      setGesture({
        type: GESTURE_TYPES.PINCH,
        scale,
        center: {
          x: (p1.clientX + p2.clientX) / 2,
          y: (p1.clientY + p2.clientY) / 2,
        },
      })
      onPinch?.({ scale, center: { x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2 } })
    }
    // Handle pan
    else if (e.touches.length === 1) {
      const deltaX = touch.clientX - t.startX
      const deltaY = touch.clientY - t.startY

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        clearTimeout(t.longPressTimer)
        setGesture({
          type: GESTURE_TYPES.PAN,
          deltaX,
          deltaY,
          x: touch.clientX,
          y: touch.clientY,
        })
        onPan?.({ deltaX, deltaY, x: touch.clientX, y: touch.clientY })
      }
    }
  }, [onPan, onPinch, preventScroll])

  // Touch end handler
  const handleTouchEnd = useCallback((e) => {
    const { current: t } = touchRef
    const now = Date.now()
    
    // Clean up touch points
    Array.from(e.changedTouches).forEach(touch => {
      t.activePoints.delete(touch.identifier)
    })

    clearTimeout(t.longPressTimer)

    // Handle tap and double tap
    if (e.changedTouches.length === 1 && 
        Math.abs(e.changedTouches[0].clientX - t.startX) < 10 && 
        Math.abs(e.changedTouches[0].clientY - t.startY) < 10) {
      
      const timeDiff = now - t.lastTap
      
      if (timeDiff < doubleTapDelay) {
        setGesture({ 
          type: GESTURE_TYPES.DOUBLE_TAP,
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
        })
        debouncedHandlers.current.doubleTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        t.lastTap = 0
      } else {
        setGesture({
          type: GESTURE_TYPES.TAP,
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
        })
        debouncedHandlers.current.tap(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        t.lastTap = now
      }
    }
    // Handle swipe
    else {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - t.startX
      const deltaY = touch.clientY - t.startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > minSwipeDistance) {
        const direction = getSwipeDirection(deltaX, deltaY)
        setGesture({ type: GESTURE_TYPES.SWIPE, direction, distance })
        onSwipe?.({ direction, distance })
      }
    }

    // Reset gesture if no more active touches
    if (t.activePoints.size === 0) {
      setGesture(null)
    }
  }, [doubleTapDelay, minSwipeDistance, onSwipe])

  // Clean up
  useEffect(() => {
    return () => {
      const { current: t } = touchRef
      clearTimeout(t.longPressTimer)
      Object.values(debouncedHandlers.current).forEach(handler => handler.cancel())
    }
  }, [])

  return {
    gesture,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    GESTURE_TYPES,
    DIRECTIONS,
  }
}

// Utility functions
const debounce = (func, wait) => {
  let timeout
  const debouncedFn = function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
  debouncedFn.cancel = () => clearTimeout(timeout)
  return debouncedFn
}

const getPinchDistance = (p1, p2) => {
  const deltaX = p2.clientX - p1.clientX
  const deltaY = p2.clientY - p1.clientY
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
}

const getSwipeDirection = (deltaX, deltaY) => {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT
  }
  return deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP
} 