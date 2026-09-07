import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { SiteIntro } from './motion/SiteIntro'
import { NavigationProvider } from './navigation/Navigation'
import './styles/colors.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NavigationProvider>
      <SiteIntro>
        <App />
      </SiteIntro>
    </NavigationProvider>
  </StrictMode>,
)
