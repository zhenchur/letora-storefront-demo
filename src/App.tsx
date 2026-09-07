import { Fragment } from 'react'
import { SiteHeader } from './components/SiteHeader'
import { SiteFooter } from './components/SiteFooter'
import ProductPage from './pages/product/ProductPage'
import { HomePage } from './pages/home/HomePage'
import { useNavigation } from './navigation/Navigation'
import { routePath } from './navigation/paths'

export function App() {
  const { location } = useNavigation()
  const pageKey = location.pathname + location.search
  if (routePath(location.pathname) === '/product/barelyef') {
    return (
      <Fragment key={pageKey}>
        <SiteHeader tone="light" fixed motion entranceAfter="product-name" entranceAt="start" />
        <ProductPage />
        <SiteFooter motion />
      </Fragment>
    )
  }

  return <HomePage key={pageKey} />
}
