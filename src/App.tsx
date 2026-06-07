import { MainApp } from './views/MainApp';
import { WidgetApp } from './views/WidgetApp';
import { ThemeApplier } from './components/ThemeApplier';

function getRoute(): 'main' | 'widget' {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'widget' || hash.startsWith('widget')) return 'widget';
  return 'main';
}

const route = getRoute();
if (route === 'widget') {
  document.documentElement.classList.add('widget-html');
  document.body.classList.add('widget-body');
}

export default function App() {
  return (
    <>
      {route === 'widget' ? <WidgetApp /> : (
        <>
          <ThemeApplier />
          <MainApp />
        </>
      )}
    </>
  );
}
