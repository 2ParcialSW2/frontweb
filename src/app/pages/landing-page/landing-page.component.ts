import { CommonModule } from '@angular/common';
import { Component, HostListener, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent implements AfterViewInit {
  constructor(private router: Router) { }
  isMenuOpen = false;
  footerVisible = false;

  testimonials = [
    { message: '¡Este software me ayudó muchísimo!', rating: 5, user: 'Ana P.' },
    { message: 'Muy intuitivo y rápido.', rating: 4, user: 'Luis M.' },
    { message: 'Excelente atención y soporte.', rating: 5, user: 'María R.' },
    { message: 'Recomendado al 100%.', rating: 5, user: 'Carlos S.' }
  ];

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  ngAfterViewInit() {
    this.fadeInOnScroll();
    this.setupTestimonialScroll();
    this.setupTestimonialScroll();

    //footer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Cuando entra en pantalla, mostrar con animación
          setTimeout(() => {
            this.footerVisible = true;
          }, 100);
        } else {
          // Cuando sale de pantalla, ocultarlo (para que vuelva a animarse después)
          this.footerVisible = false;
        }
      });
    }, {
      threshold: 0.2, // puedes ajustar cuánta parte del footer debe ser visible para disparar
    });

    observer.observe(this.footer.nativeElement);

  }

  @ViewChild('footer') footer!: ElementRef;
  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.fadeInOnScroll();
  }

  fadeInOnScroll() {
    const heroSection = document.getElementById('hero');
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    if (heroSection) {
      const heroTop = heroSection.getBoundingClientRect().top;

      if (heroTop < windowHeight - 150) {  // Aparece al estar a 150px del top
        heroSection.classList.add('opacity-100', 'translate-y-0');
      }
    }
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  setupTestimonialScroll() {
    const track = document.getElementById('testimonials-track');
    if (!track) return;

    track.addEventListener('mouseover', () => {
      track.style.animationPlayState = 'paused';
    });

    track.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  }

  // FAQs
  faqs = [
    {
      question: '¿Qué es un sistema MRP?',
      answer: 'Un sistema MRP ayuda a gestionar materiales, inventarios y planificación de producción de forma eficiente.',
      open: false
    },
    {
      question: '¿Es difícil de implementar MRPro?',
      answer: 'No, nuestro equipo te acompaña en cada etapa para que la implementación sea rápida y efectiva.',
      open: false
    },
    {
      question: '¿Puedo integrar MRPro con otros sistemas?',
      answer: 'Sí, ofrecemos integraciones personalizadas para ERP, CRM y sistemas contables.',
      open: false
    },
    {
      question: '¿Qué soporte técnico ofrecen?',
      answer: 'Disponemos de soporte técnico 24/7 mediante correo, chat en vivo y asistencia telefónica.',
      open: false
    },
    {
      question: '¿Ofrecen una versión de prueba?',
      answer: 'Sí, puedes solicitar una demo gratuita de 14 días para probar todas las funcionalidades.',
      open: false
    }
  ];

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }

  //contactanos seccion


  contacto = {
    nombre: '',
    email: '',
    mensaje: ''
  };

  enviarFormulario() {
    console.log('Datos de contacto:', this.contacto);
    // Aquí podrías integrar un servicio para enviar el mensaje a tu backend o servicio de correo
    alert('¡Mensaje enviado exitosamente!');
    this.contacto = { nombre: '', email: '', mensaje: '' }; // Limpiar el formulario
  }
  //redireccionamiento entre secciones
  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  navigateTo(route: string): void {
    this.router.navigate(['/' + route]);
  }
}