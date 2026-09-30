import { Fragment } from 'react'
import { SiteHeader } from './components/SiteHeader'
import { SiteFooter } from './components/SiteFooter'
import ProductPage from './pages/product/ProductPage'
import EditorialProductPage from './pages/product/EditorialProductPage'
import ProductV3Page from './pages/product/ProductV3Page'
import { HomePage } from './pages/home/HomePage'
import { useNavigation } from './navigation/Navigation'
import { routePath, siteUrl } from './navigation/paths'

export function App() {
  const { location } = useNavigation()
  const pageKey = location.pathname + location.search
  if (routePath(location.pathname) === '/product/barelyef-v3') {
    return (
      <div className="product-v3-page" key={pageKey}>
        <SiteHeader variant="product" motion entranceAfter="product-v3-name" entranceAt="start" accountIcon={siteUrl('assets/product-v3/account.svg')} />
        <ProductV3Page />
        <SiteFooter variant="product" motion />
      </div>
    )
  }
  if (routePath(location.pathname) === '/product/barelyef-new') {
    return (
      <div className="editorial-product-page" key={pageKey}>
        <SiteHeader variant="product" motion entranceAfter="editorial-product-name" entranceAt="start" />
        <EditorialProductPage />
        <SiteFooter variant="product" motion />
      </div>
    )
  }
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
