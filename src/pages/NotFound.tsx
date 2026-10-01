import { Compass } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyState } from '../components/ui'
import { roleProfile } from '../store/roles'
import { useStore } from '../store/store'

export function NotFound() {
  const navigate = useNavigate()
  const { state } = useStore()
  return (
    <div className="mx-auto max-w-xl py-16">
      <EmptyState
        icon={Compass}
        title="This page does not exist"
        body="The link may be outdated. Use the navigation or the Demo Guide to continue."
        action={
          <Button variant="primary" onClick={() => navigate(roleProfile(state.role).home)}>
            Back to my workspace
          </Button>
        }
      />
    </div>
  )
}
