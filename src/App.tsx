import './App.css'
import MainScreen from './screens/MainScreen'

function App() {
  return <MainScreen onStart={() => console.log('start clicked')} />
}

export default App
