import React from 'react';

const Footer = () => {
  return (
    <footer className="text-light py-5 mt-auto">
      <div>
        <div className="row">
          {/* À propos */}
          <div className="col-md-4 mb-4">
            <h3 className="h4 mb-4">À propos d'Agri-Tech</h3>
            <p className="text-muted">
              Une plateforme innovante pour la traçabilité et la gestion de la chaîne d'approvisionnement agricole utilisant la blockchain.
            </p>
          </div>

          {/* Liens rapides */}
          <div className="col-md-4 mb-4">
            <h3 className="h4 mb-4">Liens rapides</h3>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none">Accueil</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none">Services</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-muted text-decoration-none">Contact</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-md-4 mb-4">
            <h3 className="h4 mb-4">Contact</h3>
            <ul className="list-unstyled text-muted">
              <li className="mb-2">Email: contact@agri-tech.com</li>
              <li className="mb-2">Tél: +261 34 00 000 00</li>
              <li className="mb-2">Antananarivo, Madagascar</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-top border-secondary pt-4 mt-4 text-center text-muted">
          <p className="mb-0">&copy; {new Date().getFullYear()} Agri-Tech. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 