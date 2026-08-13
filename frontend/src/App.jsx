import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './ToastContext.jsx';
import Signup from './Signup.jsx';
import Signin from './Signin.jsx'
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';
import Dashboard from './Dashboard.jsx'
import Revenus from './Revenus.jsx';
import Depenses from './Depenses.jsx';
import Budget from './Budget.jsx';
import Objectifs from './Objectifs.jsx';
import Echeances from './Echeance.jsx';
import Transaction from './Transaction.jsx';

function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Navigate to= '/login'/>}/>
      <Route path='/register' element={<Signup />}/>
      <Route path='/login' element={<Signin />}/>
      <Route path='/forgotPassword' element={<ForgotPassword />}/>
      <Route path='/resetPassword' element={<ResetPassword />}/>
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/revenu' element={<Revenus />} />
      <Route path='/budget' element={< Budget />} /> 
      <Route path='/transaction' element={<Transaction />} /> 
      <Route path='/depense' element={< Depenses />} />
      <Route path='/objectifs' element={< Objectifs />} />
      <Route path='/echeances' element={<Echeances />} />
    </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
