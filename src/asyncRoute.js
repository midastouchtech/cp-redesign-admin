import Loadable from 'react-loadable';

const Loader = () => <div style={{height: "100vh", width: "100%", display: "flex", justifyContent: "center", alignItems:"center"}}>
<img src="/infinity.svg" alt="loader" />
</div>

const LoadableComponent = Component => Loadable({
  loader: Component,
  loading: Loader,
});

export default LoadableComponent