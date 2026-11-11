import { createSpatialTools } from '../spatial/tools.js'

// Register an existing Three.js subtree with Vite and return a lifecycle cleanup function.
export function connectSpatialBridge (root, hot, onChange = () => {}, { createTools = createSpatialTools } = {}) {
  if (!hot) return () => {}
  const tools = createTools(root)
  const ready = () => hot.send('spatial:ready', {})
  const handle = ({ id, request }) => {
    try {
      const result = tools(request)
      if (['apply-transform', 'update-procedural', 'orient-toward', 'align-axis'].includes(request.op)) onChange()
      hot.send('spatial:result', { id, result })
    } catch (error) {
      hot.send('spatial:result', { id, error: error.message })
    }
  }
  hot.on('spatial:request', handle)
  hot.on('vite:ws:connect', ready)
  ready()
  return () => {
    hot.off('spatial:request', handle)
    hot.off('vite:ws:connect', ready)
    hot.send('spatial:leave', {})
  }
}
