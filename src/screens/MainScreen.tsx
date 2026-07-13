import './MainScreen.css'

type MainScreenProps = {
  onStart: () => void
}

function MainScreen({ onStart }: MainScreenProps) {
  return (
    <div className="main-screen">
      <h1 className="main-screen__title">PANG</h1>
      <button className="main-screen__start-button" onClick={onStart}>
        시작하기
      </button>
    </div>
  )
}

export default MainScreen
