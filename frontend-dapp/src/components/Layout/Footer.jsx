import React from 'react';
import { Leaf, Github, Twitter, Linkedin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-dark text-white pt-5 pb-4 pt-5">
      <div className="container">
        <div className="row">
          
          {/* Logo et description */}
          <div className="col-md-4 mb-4">
            <div className="d-flex align-items-center mb-3">
              <Leaf size={32} className="text-success" />
              <span className="ms-2 h5 mb-0 fw-bold">Madagascar AgriChain</span>
            </div>
            <p className="text-light small">
              Traçabilité de produits agricoles sur la blockchain pour plus de transparence, 
              de confiance et d'efficacité dans la chaîne d'approvisionnement à Madagascar.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white-50 hover-opacity text-decoration-none">
                <Github size={20} />
              </a>
              <a href="#" className="text-white-50 hover-opacity text-decoration-none">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white-50 hover-opacity text-decoration-none">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Liens de navigation */}
          <div className="col-md-4 mb-4">
            <h5 className="text-white mb-3">Navigation</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-white-50 text-decoration-none">Accueil</a></li>
              <li><a href="/producer" className="text-white-50 text-decoration-none">Espace Producteur</a></li>
              <li><a href="/cooperative" className="text-white-50 text-decoration-none">Espace Coopérative</a></li>
              <li><a href="/about" className="text-white-50 text-decoration-none">À Propos</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-md-4 mb-4">
            <h5 className="text-white mb-3">Contact</h5>
            <ul className="list-unstyled text-white-50">
              <li>Antananarivo, Madagascar</li>
              <li>managerpipal@gmail.com</li>
              <li>+261 34 76 207 59</li>
            </ul>
          </div>
        </div>

        <div className="text-center border-top border-secondary pt-3 mt-4">
          <small className="text-white-50">
            &copy; {new Date().getFullYear()} Madagascar MadTX. Tous droits réservés.
          </small>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
