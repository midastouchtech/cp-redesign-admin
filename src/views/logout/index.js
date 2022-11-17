import cookies from 'js-cookie';


function App({ socket }) {
    

    if(typeof window !== "undefined"){
      cookies.remove("clinicplus_admin_logged_in_user")
      window.location.replace("/login")
    }
  return (
    <div class="h-100 mt-5">
    <div class="authincation h-100">
      <div class="container h-100">
        <div class="row justify-content-center h-100 align-items-center">
          <div class="col-md-6">
            <div class="authincation-content">
              <div class="row no-gutters">
                <div class="col-xl-12">
                  <div class="auth-form">
                    <div class="text-center mb-3">
                      <a href="index.html">
                        <img src="images/cp-logo.svg" alt="" />
                      </a>
                    </div>
                    <h1 class="text-center mb-4 text-white">
                      See you later alligator 👋
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

export default App;
